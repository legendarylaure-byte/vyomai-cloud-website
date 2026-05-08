import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Settings, Trash2, ExternalLink, FileText } from "lucide-react";

interface PlatformConfig {
    platform: string;
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    autoSyncEnabled: boolean;
    syncInterval: string;
    isConnected: boolean;
    isPublished: boolean;
    isManualMode: boolean;
    accountName?: string;
    lastSyncAt?: string;
    nextSyncAt?: string;
}

interface PlatformAnalytics {
    platform: string;
    followersCount: string;
    engagementRate: string;
    impressions: string;
    likes: string;
    shares: string;
    comments: string;
    postsCount: string;
}

interface SyncLog {
    id: string;
    platform: string;
    syncType: string;
    status: string;
    metricsUpdated: string[];
    errorMessage?: string;
    syncedAt: string;
}

const PLATFORMS = [
    { id: 'youtube', name: 'YouTube', icon: '📺', color: 'bg-red-500' },
    { id: 'facebook', name: 'Facebook', icon: '👥', color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-pink-500' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-sky-500' },
];

export function SocialMediaIntegrationPage() {
    const { toast } = useToast();
    const [configs, setConfigs] = useState<PlatformConfig[]>([]);
    const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

    useEffect(() => {
        fetchConfigs();
        fetchSyncLogs();

        // Check for OAuth callback success/error
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            toast({
                title: "Connected!",
                description: `${params.get('platform')} connected successfully`,
            });
            window.history.replaceState({}, '', '/admin/social-media-integration');
        } else if (params.get('error')) {
            toast({
                title: "Connection Failed",
                description: params.get('error'),
                variant: "destructive",
            });
            window.history.replaceState({}, '', '/admin/social-media-integration');
        }
    }, []);

    const fetchConfigs = async () => {
        try {
            const response = await fetch('/api/admin/social-media/config', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('vyomai-admin-token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setConfigs(data);
            }
        } catch (error) {
            console.error('Failed to fetch configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSyncLogs = async () => {
        try {
            const response = await fetch('/api/admin/social-media/sync-logs?limit=20', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('vyomai-admin-token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSyncLogs(data);
            }
        } catch (error) {
            console.error('Failed to fetch sync logs:', error);
        }
    };

    const handleConnect = async (platform: string) => {
        try {
            const response = await fetch(`/api/admin/social-media/connect/${platform}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('vyomai-admin-token')}`
                }
            });

            if (response.ok) {
                const { authUrl } = await response.json();
                window.location.href = authUrl;
            } else {
                const error = await response.json();
                toast({
                    title: "Connection Failed",
                    description: error.error || "Failed to initiate OAuth",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to connect platform",
                variant: "destructive",
            });
        }
    };

    const handleDisconnect = async (platform: string) => {
        try {
            const response = await fetch(`/api/admin/social-media/disconnect/${platform}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('vyomai-admin-token')}`
                }
            });

            if (response.ok) {
                toast({
                    title: "Disconnected",
                    description: `${platform} disconnected successfully`,
                });
                fetchConfigs();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to disconnect platform",
                variant: "destructive",
            });
        }
    };

    const handleSync = async (platform: string) => {
        setSyncing(platform);
        try {
            const response = await fetch(`/api/admin/social-media/sync/${platform}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('vyomai-admin-token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Sync Complete",
                        description: `Updated: ${result.metricsUpdated.join(', ')}`,
                    });
                } else {
                    toast({
                        title: "Sync Failed",
                        description: result.error,
                        variant: "destructive",
                    });
                }
                fetchSyncLogs();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to sync platform",
                variant: "destructive",
            });
        } finally {
            setSyncing(null);
        }
    };

    const handleSyncAll = async () => {
        setSyncing('all');
        try {
            const response = await fetch('/api/admin/social-media/sync-all', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('vyomai-admin-token')}`
                }
            });

            if (response.ok) {
                const results = await response.json();
                const successful = results.filter((r: any) => r.success).length;
                toast({
                    title: "Sync Complete",
                    description: `${successful}/${results.length} platforms synced successfully`,
                });
                fetchSyncLogs();
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to sync platforms",
                variant: "destructive",
            });
        } finally {
            setSyncing(null);
        }
    };

    const handleUpdateConfig = async (platform: string, updates: Partial<PlatformConfig>) => {
        try {
            const response = await fetch(`/api/admin/social-media/config/${platform}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('vyomai-admin-token')}`
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                toast({
                    title: "Settings Updated",
                    description: `${platform} configuration saved`,
                });
                fetchConfigs();
                setSelectedPlatform(null);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update configuration",
                variant: "destructive",
            });
        }
    };

    const getPlatformConfig = (platformId: string): PlatformConfig | undefined => {
        return configs.find(c => c.platform === platformId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Social Media Integration</h1>
                    <p className="text-gray-600 mt-1">Connect and sync analytics from your social media platforms</p>
                </div>
                <Button onClick={handleSyncAll} disabled={syncing === 'all'}>
                    {syncing === 'all' ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
                    ) : (
                        <><RefreshCw className="w-4 h-4 mr-2" /> Sync All</>
                    )}
                </Button>
            </div>

            <Tabs defaultValue="platforms" className="w-full">
                <TabsList>
                    <TabsTrigger value="platforms">Platforms</TabsTrigger>
                    <TabsTrigger value="logs">Sync Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="platforms" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {PLATFORMS.map(platform => {
                            const config = getPlatformConfig(platform.id);
                            const isConnected = config?.isConnected || false;

                            return (
                                <Card key={platform.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{platform.icon}</span>
                                                <CardTitle>{platform.name}</CardTitle>
                                                <Switch
                                                    checked={config?.isPublished !== false}
                                                    onCheckedChange={(val) => handleUpdateConfig(platform.id, { isPublished: val })}
                                                    title={config?.isPublished ? "Visible on website" : "Hidden from website"}
                                                />
                                            </div>
                                            {isConnected ? (
                                                <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</Badge>
                                            ) : (
                                                <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Not Connected</Badge>
                                            )}
                                        </div>
                                        {config?.accountName && (
                                            <CardDescription>{config.accountName}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {config?.lastSyncAt && (
                                            <div className="text-sm text-gray-600">
                                                Last sync: {new Date(config.lastSyncAt).toLocaleString()}
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {isConnected ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSync(platform.id)}
                                                        disabled={syncing === platform.id}
                                                        className="flex-1"
                                                    >
                                                        {syncing === platform.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <><RefreshCw className="w-4 h-4 mr-1" /> Sync</>
                                                        )}
                                                    </Button>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" onClick={() => setSelectedPlatform(platform.id)}>
                                                                <Settings className="w-4 h-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>{platform.name} Settings</DialogTitle>
                                                                <DialogDescription>Configure auto-sync and API credentials</DialogDescription>
                                                            </DialogHeader>
                                                            <PlatformSettings
                                                                platform={platform.id}
                                                                config={config}
                                                                onSave={(updates) => handleUpdateConfig(platform.id, updates)}
                                                                onDisconnect={() => handleDisconnect(platform.id)}
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                    {config?.isManualMode && (
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" variant="outline">
                                                                    <FileText className="w-4 h-4 mr-1" /> Data
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-md">
                                                                <DialogHeader>
                                                                    <DialogTitle>Manual Metrics: {platform.name}</DialogTitle>
                                                                    <DialogDescription>Manually enter your social media stats</DialogDescription>
                                                                </DialogHeader>
                                                                <ManualMetricsEditor platform={platform.id} />
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex flex-col w-full gap-2">
                                                    <div className="flex gap-2">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    className="flex-1"
                                                                    onClick={() => setSelectedPlatform(platform.id)}
                                                                >
                                                                    {config?.clientId ? (
                                                                        <><ExternalLink className="w-4 h-4 mr-1" /> Connect</>
                                                                    ) : (
                                                                        <><Settings className="w-4 h-4 mr-1" /> Configure</>
                                                                    )}
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Setup {platform.name}</DialogTitle>
                                                                    <DialogDescription>
                                                                        {config?.clientId
                                                                            ? "Click 'Connect' to authorize access via OAuth"
                                                                            : "Enter your API credentials to get started"
                                                                        }
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <PlatformSetup
                                                                    platform={platform.id}
                                                                    platformName={platform.name}
                                                                    config={config}
                                                                    onSave={(updates) => handleUpdateConfig(platform.id, updates)}
                                                                    onConnect={() => handleConnect(platform.id)}
                                                                />
                                                            </DialogContent>
                                                        </Dialog>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className={config?.isManualMode ? "bg-orange-100 text-orange-700" : ""}
                                                            onClick={() => handleUpdateConfig(platform.id, { isManualMode: !config?.isManualMode })}
                                                        >
                                                            {config?.isManualMode ? "Using Manual" : "Switch Manual"}
                                                        </Button>
                                                    </div>
                                                    {config?.isManualMode && (
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" variant="outline" className="w-full">
                                                                    <FileText className="w-4 h-4 mr-1" /> Edit Manual Data
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-md">
                                                                <DialogHeader>
                                                                    <DialogTitle>Manual Metrics: {platform.name}</DialogTitle>
                                                                    <DialogDescription>Manually enter your social media stats</DialogDescription>
                                                                </DialogHeader>
                                                                <ManualMetricsEditor platform={platform.id} />
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sync History</CardTitle>
                            <CardDescription>Recent synchronization logs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {syncLogs.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No sync logs yet</p>
                                ) : (
                                    syncLogs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">
                                                    {PLATFORMS.find(p => p.id === log.platform)?.icon}
                                                </span>
                                                <div>
                                                    <div className="font-medium">{log.platform}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {new Date(log.syncedAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {log.status === 'success' ? (
                                                    <Badge className="bg-green-500">Success</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Failed</Badge>
                                                )}
                                                {log.metricsUpdated && log.metricsUpdated.length > 0 && (
                                                    <span className="text-sm text-gray-600">
                                                        {log.metricsUpdated.join(', ')}
                                                    </span>
                                                )}
                                                {log.errorMessage && (
                                                    <span className="text-sm text-red-600">{log.errorMessage}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );

}

function PlatformSetup({
    platform,
    platformName,
    config,
    onSave,
    onConnect
}: {
    platform: string;
    platformName: string;
    config?: PlatformConfig;
    onSave: (updates: Partial<PlatformConfig>) => void;
    onConnect: () => void;
}) {
    const [clientId, setClientId] = useState(config?.clientId || '');
    const [clientSecret, setClientSecret] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const updates: Partial<PlatformConfig> = {};

        if (clientId) updates.clientId = clientId;
        if (clientSecret) updates.clientSecret = clientSecret;
        if (apiKey) updates.apiKey = apiKey;

        await onSave(updates);
        setSaving(false);
    };

    const hasCredentials = config?.clientId || clientId;

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-900 mb-2">📋 Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Get your API credentials from {platformName} Developer Portal</li>
                    <li>Enter Client ID and Client Secret below</li>
                    <li>Save credentials</li>
                    <li>Click "Connect with {platformName}" to authorize</li>
                </ol>
            </div>

            <div className="space-y-3">
                <div className="space-y-2">
                    <Label>Client ID *</Label>
                    <Input
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder={`Enter ${platformName} Client ID`}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Client Secret *</Label>
                    <Input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder={`Enter ${platformName} Client Secret`}
                    />
                </div>

                <div className="space-y-2">
                    <Label>API Key (optional)</Label>
                    <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter API key if using key-based auth"
                    />
                    <p className="text-xs text-gray-500">
                        Some platforms support API key authentication as an alternative to OAuth
                    </p>
                </div>
            </div>

            <div className="flex gap-2 pt-4">
                {!hasCredentials ? (
                    <Button onClick={handleSave} disabled={!clientId || !clientSecret || saving} className="flex-1">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Save Credentials
                    </Button>
                ) : (
                    <>
                        <Button onClick={handleSave} variant="outline" disabled={saving} className="flex-1">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Update Credentials
                        </Button>
                        <Button onClick={onConnect} className="flex-1">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect with {platformName}
                        </Button>
                    </>
                )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium mb-1">🔒 Security Note:</p>
                <p>Your credentials are encrypted using AES-256-GCM before being stored in the database.</p>
            </div>
        </div>
    );
}

function PlatformSettings({
    platform,
    config,
    onSave,
    onDisconnect
}: {
    platform: string;
    config?: PlatformConfig;
    onSave: (updates: Partial<PlatformConfig>) => void;
    onDisconnect: () => void;
}) {
    const [autoSync, setAutoSync] = useState(config?.autoSyncEnabled || false);
    const [syncInterval, setSyncInterval] = useState(config?.syncInterval || '1h');
    const [clientId, setClientId] = useState(config?.clientId || '');
    const [clientSecret, setClientSecret] = useState('');
    const [apiKey, setApiKey] = useState('');

    const handleSave = () => {
        const updates: Partial<PlatformConfig> = {
            autoSyncEnabled: autoSync,
            syncInterval,
        };

        if (clientId) updates.clientId = clientId;
        if (clientSecret) updates.clientSecret = clientSecret;
        if (apiKey) updates.apiKey = apiKey;

        onSave(updates);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter client ID"
                />
            </div>

            <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Enter client secret (leave empty to keep current)"
                />
            </div>

            <div className="space-y-2">
                <Label>API Key (optional)</Label>
                <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key if using key-based auth"
                />
            </div>

            <div className="flex items-center justify-between">
                <Label>Auto-Sync Enabled</Label>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            {autoSync && (
                <div className="space-y-2">
                    <Label>Sync Interval</Label>
                    <Select value={syncInterval} onValueChange={setSyncInterval}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15m">Every 15 minutes</SelectItem>
                            <SelectItem value="30m">Every 30 minutes</SelectItem>
                            <SelectItem value="1h">Every hour</SelectItem>
                            <SelectItem value="6h">Every 6 hours</SelectItem>
                            <SelectItem value="24h">Every 24 hours</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">Save Settings</Button>
                <Button variant="destructive" onClick={onDisconnect}>
                    <Trash2 className="w-4 h-4 mr-1" /> Disconnect
                </Button>
            </div>
        </div>
    );
}

function ManualMetricsEditor({ platform }: { platform: string }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [metrics, setMetrics] = useState<PlatformAnalytics>({
        platform,
        followersCount: '0',
        engagementRate: '0',
        impressions: '0',
        likes: '0',
        shares: '0',
        comments: '0',
        postsCount: '0'
    });

    useEffect(() => {
        fetchAnalytics();
    }, [platform]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`/api/admin/social-media/analytics/${platform}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('vyomai-admin-token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/social-media/analytics/${platform}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('vyomai-admin-token')}`
                },
                body: JSON.stringify(metrics)
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Manual metrics updated successfully",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update metrics",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Followers</Label>
                    <Input
                        type="number"
                        value={metrics.followersCount}
                        onChange={(e) => setMetrics({ ...metrics, followersCount: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Engagement Rate (%)</Label>
                    <Input
                        type="number"
                        value={metrics.engagementRate}
                        onChange={(e) => setMetrics({ ...metrics, engagementRate: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Impressions</Label>
                    <Input
                        type="number"
                        value={metrics.impressions}
                        onChange={(e) => setMetrics({ ...metrics, impressions: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Likes</Label>
                    <Input
                        type="number"
                        value={metrics.likes}
                        onChange={(e) => setMetrics({ ...metrics, likes: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Shares</Label>
                    <Input
                        type="number"
                        value={metrics.shares}
                        onChange={(e) => setMetrics({ ...metrics, shares: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Comments</Label>
                    <Input
                        type="number"
                        value={metrics.comments}
                        onChange={(e) => setMetrics({ ...metrics, comments: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Posts Count</Label>
                    <Input
                        type="number"
                        value={metrics.postsCount}
                        onChange={(e) => setMetrics({ ...metrics, postsCount: e.target.value })}
                    />
                </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Manual Data
            </Button>
        </div>
    );
}

export default SocialMediaIntegrationPage;
