import { ContractorPortalLayout } from "@/components/contractor/ContractorPortalLayout";
import SubcontractorManagement from "@/pages/SubcontractorManagement";

export default function ContractorSubcontractors() {
  return (
    <ContractorPortalLayout 
      title="Subcontractor Management" 
      description="Manage your subcontractor team and operations"
    >
      {/* Use SubcontractorManagement but without AdminLayout wrapper */}
      <div className="space-y-6">
        <SubcontractorManagement />
      </div>
    </ContractorPortalLayout>
  );
}