package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"time"
)

type DaemonState string

const (
	DaemonStopped  DaemonState = "stopped"
	DaemonStarting DaemonState = "starting"
	DaemonRunning  DaemonState = "running"
	DaemonError    DaemonState = "error"
)

type DaemonStatus struct {
	State   DaemonState `json:"state"`
	Version string      `json:"version"`
	PID     int         `json:"pid"`
	Uptime  string      `json:"uptime"`
	Error   string      `json:"error,omitempty"`
}

type Daemon struct {
	mu        sync.Mutex
	cmd       *exec.Cmd
	state     DaemonState
	startTime time.Time
	lastErr   string
	binPath   string
	version   string
}

func NewDaemon() *Daemon {
	return &Daemon{
		state: DaemonStopped,
	}
}

func (d *Daemon) dataDir() string {
	home, _ := os.UserHomeDir()
	dir := filepath.Join(home, ".agentguard", "desktop")
	os.MkdirAll(dir, 0755)
	return dir
}

func (d *Daemon) binaryPath() string {
	name := "agentguard"
	if runtime.GOOS == "windows" {
		name = "agentguard.exe"
	}
	return filepath.Join(d.dataDir(), name)
}

func (d *Daemon) versionFilePath() string {
	return filepath.Join(d.dataDir(), "version.txt")
}

func (d *Daemon) localVersion() string {
	data, err := os.ReadFile(d.versionFilePath())
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

type githubRelease struct {
	TagName string        `json:"tag_name"`
	Assets  []githubAsset `json:"assets"`
}

type githubAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

func platformBinaryName() string {
	switch {
	case runtime.GOOS == "darwin" && runtime.GOARCH == "arm64":
		return "agentguard-mac-arm64"
	case runtime.GOOS == "darwin" && runtime.GOARCH == "amd64":
		return "agentguard-mac-amd64"
	case runtime.GOOS == "linux" && runtime.GOARCH == "amd64":
		return "agentguard-linux-amd64"
	case runtime.GOOS == "windows" && runtime.GOARCH == "amd64":
		return "agentguard-windows-amd64.exe"
	default:
		return ""
	}
}

func (d *Daemon) FetchLatestVersion() (string, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get("https://api.github.com/repos/contail/AgentGuard/releases/latest")
	if err != nil {
		return "", fmt.Errorf("failed to check releases: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API returned %d", resp.StatusCode)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", fmt.Errorf("failed to parse release: %w", err)
	}
	return release.TagName, nil
}

func (d *Daemon) Download(version string) error {
	binaryName := platformBinaryName()
	if binaryName == "" {
		return fmt.Errorf("unsupported platform: %s/%s", runtime.GOOS, runtime.GOARCH)
	}

	tag := version
	if !strings.HasPrefix(tag, "v") {
		tag = "v" + tag
	}
	url := fmt.Sprintf("https://github.com/contail/AgentGuard/releases/download/%s/%s", tag, binaryName)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download returned HTTP %d", resp.StatusCode)
	}

	destPath := d.binaryPath()
	tmpPath := destPath + ".tmp"

	f, err := os.Create(tmpPath)
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}

	if _, err := io.Copy(f, resp.Body); err != nil {
		f.Close()
		os.Remove(tmpPath)
		return fmt.Errorf("failed to write binary: %w", err)
	}
	f.Close()

	if runtime.GOOS != "windows" {
		os.Chmod(tmpPath, 0755)
	}

	if err := os.Rename(tmpPath, destPath); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("failed to install binary: %w", err)
	}

	ver := strings.TrimPrefix(tag, "v")
	os.WriteFile(d.versionFilePath(), []byte(ver), 0644)

	d.mu.Lock()
	d.binPath = destPath
	d.version = ver
	d.mu.Unlock()

	return nil
}

func (d *Daemon) EnsureBinary() error {
	binPath := d.binaryPath()
	if _, err := os.Stat(binPath); err == nil {
		d.mu.Lock()
		d.binPath = binPath
		d.version = d.localVersion()
		d.mu.Unlock()
		return nil
	}

	latestTag, err := d.FetchLatestVersion()
	if err != nil {
		return fmt.Errorf("no local binary and cannot fetch latest: %w", err)
	}

	return d.Download(latestTag)
}

func (d *Daemon) Start() error {
	d.mu.Lock()
	if d.state == DaemonRunning || d.state == DaemonStarting {
		d.mu.Unlock()
		return nil
	}

	if d.binPath == "" {
		d.mu.Unlock()
		if err := d.EnsureBinary(); err != nil {
			return err
		}
		d.mu.Lock()
	}

	d.state = DaemonStarting
	d.lastErr = ""
	binPath := d.binPath
	d.mu.Unlock()

	cmd := exec.Command(binPath)
	cmd.Env = append(os.Environ(),
		"AGENTGUARD_GATE_ENABLED=true",
		"AGENTGUARD_LLM_ENABLED=true",
	)

	logDir := d.dataDir()
	logFile, err := os.OpenFile(
		filepath.Join(logDir, "agentguard.log"),
		os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644,
	)
	if err == nil {
		cmd.Stdout = logFile
		cmd.Stderr = logFile
	}

	if err := cmd.Start(); err != nil {
		d.mu.Lock()
		d.state = DaemonError
		d.lastErr = err.Error()
		d.mu.Unlock()
		return fmt.Errorf("failed to start agentguard: %w", err)
	}

	d.mu.Lock()
	d.cmd = cmd
	d.state = DaemonRunning
	d.startTime = time.Now()
	d.mu.Unlock()

	go func() {
		err := cmd.Wait()
		d.mu.Lock()
		d.state = DaemonStopped
		if err != nil {
			d.lastErr = err.Error()
			d.state = DaemonError
		}
		d.cmd = nil
		d.mu.Unlock()
		if logFile != nil {
			logFile.Close()
		}
	}()

	return nil
}

func (d *Daemon) Stop() error {
	d.mu.Lock()
	cmd := d.cmd
	d.mu.Unlock()

	if cmd == nil || cmd.Process == nil {
		return nil
	}

	if runtime.GOOS == "windows" {
		return cmd.Process.Kill()
	}
	cmd.Process.Signal(syscall.SIGTERM)

	done := make(chan struct{})
	go func() {
		cmd.Process.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(5 * time.Second):
		cmd.Process.Kill()
	}

	d.mu.Lock()
	d.state = DaemonStopped
	d.cmd = nil
	d.mu.Unlock()

	return nil
}

func (d *Daemon) Status() DaemonStatus {
	d.mu.Lock()
	defer d.mu.Unlock()

	status := DaemonStatus{
		State:   d.state,
		Version: d.version,
		Error:   d.lastErr,
	}

	if d.cmd != nil && d.cmd.Process != nil {
		status.PID = d.cmd.Process.Pid
	}

	if d.state == DaemonRunning && !d.startTime.IsZero() {
		dur := time.Since(d.startTime)
		status.Uptime = formatDuration(dur)
	}

	return status
}

func formatDuration(d time.Duration) string {
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	s := int(d.Seconds()) % 60
	if h > 0 {
		return fmt.Sprintf("%dh %dm %ds", h, m, s)
	}
	if m > 0 {
		return fmt.Sprintf("%dm %ds", m, s)
	}
	return fmt.Sprintf("%ds", s)
}
