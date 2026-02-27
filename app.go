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
	go a.daemon.EnsureBinary()
}

func (a *App) shutdown(ctx context.Context) {
	a.daemon.Stop()
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
	local := a.daemon.localVersion()
	remote, err := a.daemon.FetchLatestVersion()
	if err != nil {
		return fmt.Sprintf(`{"error":"%s"}`, err.Error())
	}
	result := map[string]interface{}{
		"local":    local,
		"remote":   remote,
		"updateOk": local != "" && remote != "" && ("v"+local) != remote,
	}
	data, _ := json.Marshal(result)
	return string(data)
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
