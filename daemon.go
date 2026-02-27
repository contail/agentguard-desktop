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
	"strconv"
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

	probeURL    = "http://localhost:10180/agentguard/stats"
	pidFileName = "agentguard.pid"
)

type DaemonStatus struct {
	State   DaemonState `json:"state"`
	Version string      `json:"version"`
	PID     int         `json:"pid"`
	Uptime  string      `json:"uptime"`
	Error   string      `json:"error,omitempty"`
	Managed bool        `json:"managed"`
}

type Daemon struct {
	mu        sync.Mutex
	state     DaemonState
	startTime time.Time
	lastErr   string
	binPath   string
	version   string
	managed   bool // true = we spawned via launchctl/direct, false = attached to existing
}

func NewDaemon() *Daemon {
	return &Daemon{state: DaemonStopped}
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

func (d *Daemon) pidFilePath() string {
	return filepath.Join(d.dataDir(), pidFileName)
}

func (d *Daemon) logFilePath() string {
	return filepath.Join(d.dataDir(), "agentguard.log")
}

func (d *Daemon) localVersion() string {
	data, err := os.ReadFile(d.versionFilePath())
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

// --- Probe: detect already-running daemon ---

func (d *Daemon) Probe() bool {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(probeURL)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false
	}

	var stats struct {
		Version string `json:"version"`
		Uptime  string `json:"uptime"`
	}
	body, _ := io.ReadAll(resp.Body)
	if json.Unmarshal(body, &stats) != nil {
		return false
	}

	d.mu.Lock()
	d.state = DaemonRunning
	d.version = stats.Version
	d.managed = false
	d.lastErr = ""
	d.mu.Unlock()

	return true
}

// --- Process management (detached, survives app exit) ---

func (d *Daemon) startDirect() error {
	binPath := d.binaryPath()
	cmd := exec.Command(binPath)
	cmd.Env = append(os.Environ(),
		"AGENTGUARD_GATE_ENABLED=true",
		"AGENTGUARD_LLM_ENABLED=true",
	)

	logFile, err := os.OpenFile(d.logFilePath(), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err == nil {
		cmd.Stdout = logFile
		cmd.Stderr = logFile
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start agentguard: %w", err)
	}

	// Write PID file for tracking
	os.WriteFile(d.pidFilePath(), []byte(strconv.Itoa(cmd.Process.Pid)), 0644)

	// Detach: release the process so it survives our exit
	cmd.Process.Release()

	return nil
}

func (d *Daemon) stopDirect() error {
	pidData, err := os.ReadFile(d.pidFilePath())
	if err != nil {
		return nil
	}
	pid, err := strconv.Atoi(strings.TrimSpace(string(pidData)))
	if err != nil {
		return nil
	}

	proc, err := os.FindProcess(pid)
	if err != nil {
		return nil
	}
	proc.Signal(syscall.SIGTERM)

	for i := 0; i < 10; i++ {
		time.Sleep(500 * time.Millisecond)
		if err := syscall.Kill(pid, 0); err != nil {
			break
		}
	}

	os.Remove(d.pidFilePath())
	return nil
}

// --- GitHub Release ---

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

// --- Public API ---

func (d *Daemon) Start() error {
	d.mu.Lock()
	if d.state == DaemonRunning || d.state == DaemonStarting {
		d.mu.Unlock()
		return nil
	}
	d.mu.Unlock()

	// Check if daemon is already running externally
	if d.Probe() {
		return nil
	}

	if err := d.EnsureBinary(); err != nil {
		return err
	}

	d.mu.Lock()
	d.state = DaemonStarting
	d.lastErr = ""
	d.mu.Unlock()

	err := d.startDirect()

	if err != nil {
		d.mu.Lock()
		d.state = DaemonError
		d.lastErr = err.Error()
		d.mu.Unlock()
		return err
	}

	// Wait for daemon to become healthy
	for i := 0; i < 20; i++ {
		time.Sleep(250 * time.Millisecond)
		if d.Probe() {
			d.mu.Lock()
			d.managed = true
			d.startTime = time.Now()
			d.mu.Unlock()
			return nil
		}
	}

	d.mu.Lock()
	d.state = DaemonError
	d.lastErr = "daemon started but not responding after 5s"
	d.mu.Unlock()
	return fmt.Errorf("daemon started but not responding")
}

func (d *Daemon) Stop() error {
	d.mu.Lock()
	if d.state != DaemonRunning {
		d.mu.Unlock()
		return nil
	}
	d.mu.Unlock()

	d.stopDirect()

	d.mu.Lock()
	d.state = DaemonStopped
	d.managed = false
	d.lastErr = ""
	d.mu.Unlock()

	return nil
}

func (d *Daemon) Status() DaemonStatus {
	// Always probe to get fresh state
	if d.Probe() {
		// already updated inside Probe()
	} else {
		d.mu.Lock()
		if d.state == DaemonRunning {
			d.state = DaemonStopped
			d.managed = false
		}
		d.mu.Unlock()
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	status := DaemonStatus{
		State:   d.state,
		Version: d.version,
		Error:   d.lastErr,
		Managed: d.managed,
	}

	if d.state == DaemonRunning && !d.startTime.IsZero() {
		status.Uptime = formatDuration(time.Since(d.startTime))
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
