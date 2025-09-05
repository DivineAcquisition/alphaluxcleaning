import { ContractorPortalLayout } from "@/components/contractor/ContractorPortalLayout";
import ApplicationManager from "@/pages/ApplicationManager";

export default function ContractorApplications() {
  return (
    <ContractorPortalLayout 
      title="Applications Manager" 
      description="Review and manage subcontractor applications"
    >
      {/* Use ApplicationManager but without AdminLayout wrapper */}
      <div className="space-y-6">
        <ApplicationManager useContractorLayout={true} />
      </div>
    </ContractorPortalLayout>
  );
}