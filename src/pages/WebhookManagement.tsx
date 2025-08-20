import { Navigation } from '@/components/Navigation';
import { WebhookConfigurationPanel } from '@/components/admin/WebhookConfigurationPanel';
import { WebhookTestingInterface } from '@/components/admin/WebhookTestingInterface';

export default function WebhookManagement() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Webhook Management</h1>
            <p className="text-muted-foreground mt-2">
              Configure webhooks to receive real-time booking notifications in your external systems.
            </p>
          </div>
          
          <WebhookConfigurationPanel />
          
          <div className="mt-8">
            <WebhookTestingInterface />  
          </div>
        </div>
      </div>
    </div>
  );
}