package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const AppVersion = "1.0.0"

type App struct {
	ctx    context.Context
	daemon *Daemon
}

func NewApp() *App {
	return &App{
		daemon: NewDaemon(),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	go func() {
		a.daemon.EnsureBinary()
		a.daemon.Probe()
	}()
}

func (a *App) shutdown(ctx context.Context) {
	// Don't stop daemon on app exit — it runs independently as a system service
}

func (a *App) StartDaemon() string {
	if err := a.daemon.Start(); err != nil {
		return fmt.Sprintf(`{"error":"%s"}`, err.Error())
	}
	return `{"status":"ok"}`
}

func (a *App) StopDaemon() string {
	if err := a.daemon.Stop(); err != nil {
		return fmt.Sprintf(`{"error":"%s"}`, err.Error())
	}
	return `{"status":"ok"}`
}

func (a *App) RestartDaemon() string {
	a.daemon.Stop()
	if err := a.daemon.Start(); err != nil {
		return fmt.Sprintf(`{"error":"%s"}`, err.Error())
	}
	return `{"status":"ok"}`
}

func (a *App) GetDaemonStatus() string {
	status := a.daemon.Status()
	data, _ := json.Marshal(status)
	return string(data)
}

func (a *App) CheckForUpdate() string {
	result := map[string]interface{}{}

	// Core binary update check
	coreLocal := a.daemon.localVersion()
	coreRemote, err := a.daemon.FetchLatestVersion()
	if err != nil {
		result["coreError"] = err.Error()
	} else {
		coreAvailable := coreLocal != "" && coreRemote != "" && ("v"+coreLocal) != coreRemote
		result["coreLocal"] = coreLocal
		result["coreRemote"] = coreRemote
		result["coreUpdateAvailable"] = coreAvailable
	}

	// Desktop app update check
	result["appVersion"] = AppVersion
	desktopRemote, err := fetchLatestRelease("contail/agentguard-desktop")
	if err != nil {
		result["desktopError"] = err.Error()
	} else {
		desktopAvailable := desktopRemote != "" && ("v"+AppVersion) != desktopRemote
		result["desktopRemote"] = desktopRemote
		result["desktopUpdateAvailable"] = desktopAvailable
		if desktopAvailable {
			result["desktopDownloadURL"] = fmt.Sprintf("https://github.com/contail/agentguard-desktop/releases/tag/%s", desktopRemote)
		}
	}

	data, _ := json.Marshal(result)
	return string(data)
}

func fetchLatestRelease(repo string) (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", repo))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return "", nil
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API returned %d", resp.StatusCode)
	}
	var release struct {
		TagName string `json:"tag_name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", err
	}
	return release.TagName, nil
}

func (a *App) UpdateDaemon() string {
	a.daemon.Stop()

	tag, err := a.daemon.FetchLatestVersion()
	if err != nil {
		return fmt.Sprintf(`{"error":"%s"}`, err.Error())
	}
	if err := a.daemon.Download(tag); err != nil {
		return fmt.Sprintf(`{"error":"%s"}`, err.Error())
	}
	if err := a.daemon.Start(); err != nil {
		return fmt.Sprintf(`{"error":"updated but failed to restart: %s"}`, err.Error())
	}

	return fmt.Sprintf(`{"status":"ok","version":"%s"}`, tag)
}

func (a *App) GetProxyStats() string {
	return a.fetchAPI("http://localhost:10180/agentguard/stats")
}

func (a *App) GetAgentGuardConfig() string {
	return a.fetchAPI("http://localhost:10180/api/config/agentguard")
}

func (a *App) SaveAgentGuardConfig(configJSON string) string {
	return a.postAPI("http://localhost:10180/api/config/agentguard", configJSON)
}

func (a *App) GetOpenClawConfig() string {
	return a.fetchAPI("http://localhost:10180/api/config/openclaw")
}

func (a *App) SaveOpenClawConfig(configJSON string) string {
	return a.postAPI("http://localhost:10180/api/config/openclaw", configJSON)
}

func (a *App) GetApprovals() string {
	return a.fetchAPI("http://localhost:10180/api/approvals")
}

func (a *App) HandleApproval(id, action string) string {
	url := fmt.Sprintf("http://localhost:10180/api/approvals/%s/%s", id, action)
	return a.postAPI(url, "")
}

// --- MCP API bindings ---

func (a *App) GetMCPPolicy() string {
	return a.fetchAPI("http://localhost:10180/api/mcp/policy")
}

func (a *App) SaveMCPPolicy(policyJSON string) string {
	return a.postAPI("http://localhost:10180/api/mcp/policy", policyJSON)
}

func (a *App) GetMCPAudit() string {
	return a.fetchAPI("http://localhost:10180/api/mcp/audit")
}

func (a *App) GetMCPClients() string {
	return a.fetchAPI("http://localhost:10180/api/mcp/clients")
}

func (a *App) WrapMCPClient(client string) string {
	body := fmt.Sprintf(`{"client":"%s","undo":false}`, client)
	return a.postAPI("http://localhost:10180/api/mcp/wrap", body)
}

func (a *App) UnwrapMCPClient(client string) string {
	body := fmt.Sprintf(`{"client":"%s","undo":true}`, client)
	return a.postAPI("http://localhost:10180/api/mcp/wrap", body)
}

func (a *App) fetchAPI(url string) string {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return fmt.Sprintf(`{"error":"connection failed: %s"}`, err.Error())
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body)
}

func (a *App) postAPI(url, bodyJSON string) string {
	client := &http.Client{Timeout: 5 * time.Second}

	var bodyReader io.Reader
	if bodyJSON != "" {
		bodyReader = strings.NewReader(bodyJSON)
	}

	req, err := http.NewRequest("POST", url, bodyReader)
	if err != nil {
		return fmt.Sprintf(`{"error":"%s"}`, err.Error())
	}
	if bodyJSON != "" {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Sprintf(`{"error":"connection failed: %s"}`, err.Error())
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body)
}
