import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, RefreshCw, CheckCircle, XCircle, Upload } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export const AirtableIntegrationPanel = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle')
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncStats, setSyncStats] = useState<any>(null)
  const { toast } = useToast()

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-airtable', {
        body: { action: 'test_connection' }
      })

      if (error) throw error

      if (data?.success) {
        setConnectionStatus('connected')
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Airtable base",
        })
      } else {
        throw new Error(data?.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Airtable",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const syncAllOrders = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-airtable', {
        body: { action: 'sync_all_orders' }
      })

      if (error) throw error

      if (data?.success) {
        setSyncStats(data.data)
        setLastSync(new Date().toLocaleString())
        toast({
          title: "Sync Completed",
          description: `Successfully synced ${data.data.syncedCount} orders to Airtable`,
        })
      } else {
        throw new Error(data?.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Sync failed:', error)
      toast({
        title: "Sync Failed", 
        description: error.message || "Failed to sync orders to Airtable",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Airtable Integration
        </CardTitle>
        <CardDescription>
          Sync booking data to your Airtable base in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Connection Status:</span>
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}
              className="flex items-center gap-1"
            >
              {connectionStatus === 'connected' ? (
                <CheckCircle className="h-3 w-3" />
              ) : connectionStatus === 'error' ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <Database className="h-3 w-3" />
              )}
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Unknown'}
            </Badge>
          </div>
          <Button
            onClick={testConnection}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Test Connection
          </Button>
        </div>

        {/* Base Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Base ID:</span>
            <p className="text-muted-foreground font-mono">appFVs6wCxVMLa64Y</p>
          </div>
          <div>
            <span className="font-medium">Tables:</span>
            <p className="text-muted-foreground">9 tables configured</p>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="space-y-2">
          <Button
            onClick={syncAllOrders}
            disabled={isLoading || connectionStatus !== 'connected'}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Sync All Orders to Airtable
          </Button>
        </div>

        {/* Sync Stats */}
        {syncStats && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Last Sync Results</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Records Synced:</span>
                <p className="font-medium">{syncStats.syncedCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Sync:</span>
                <p className="font-medium">{lastSync}</p>
              </div>
            </div>
            {syncStats.results && (
              <div className="mt-2">
                <span className="text-muted-foreground text-xs">
                  Success Rate: {Math.round((syncStats.results.filter(r => r.success).length / syncStats.results.length) * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Table Mapping Info */}
        <div className="space-y-2">
          <h4 className="font-medium">Airtable Table Mapping</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>• Orders → Order details</div>
            <div>• Customers → Customer data</div>
            <div>• Service Details → Service info</div>
            <div>• Add-Ons & Services → Service add-ons</div>
            <div>• Pricing & Discounts → Pricing data</div>
            <div>• Labor Costs → Employee tracking</div>
            <div>• Property Details → Address info</div>
            <div>• Analytics & Tracking → Metrics</div>
            <div>• Webhook Logs → Sync logs</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}