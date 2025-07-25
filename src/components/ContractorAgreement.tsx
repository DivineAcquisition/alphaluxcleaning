import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ContractorAgreementProps {
  contractorName?: string;
}

const ContractorAgreement = ({ contractorName = "[CONTRACTOR NAME]" }: ContractorAgreementProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          INDEPENDENT CONTRACTOR AGREEMENT
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full rounded border p-4">
          <div className="space-y-6 text-sm">
            <div className="text-center space-y-2">
              <p className="font-semibold">
                THIS INDEPENDENT CONTRACTOR AGREEMENT (THE AGREEMENT)
              </p>
              <p className="font-semibold">DATED THIS _____ BY AND BETWEEN</p>
              <p className="font-semibold">
                BAY AREA CLEANING PROFESSIONALS LLC OF 3210 LANCELOT BAYTOWN TX 77521 USA ("THE CLIENT")
              </p>
              <p className="font-semibold">AND</p>
              <p className="font-semibold">{contractorName} ("CONTRACTOR").</p>
            </div>

            <Separator />

            <div>
              <h3 className="font-bold mb-2">BACKGROUND:</h3>
              <p className="mb-2">
                The Client is of the opinion that the Contractor has the necessary qualifications, experience and abilities to provide services to the Client.
              </p>
              <p className="mb-2">
                The Contractor is agreeable to providing such services to the Client on the terms and conditions set out in this Agreement.
              </p>
              <p>
                IN CONSIDERATION OF the matters described above and of the mutual benefits and obligations set forth in this Agreement, the receipt and sufficiency of which consideration is hereby acknowledged, the Client and the Contractor (individually the "Party" and collectively the "Parties" to this Agreement) agree as follows:
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Services Provided</h3>
              <p className="mb-2">
                1. The Client hereby agrees to engage the Contractor to provide the Client with services (the "Services") consisting of: 50% Commission
              </p>
              <p>
                2. The Services will also include any other tasks which the Parties may agree on. The Contractor hereby agrees to provide such Services on behalf of Client.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Term of Agreement</h3>
              <p className="mb-2">
                1. The term of this Agreement (the "Term") will begin on the date of this Agreement and will remain in full force and effect indefinitely until terminated as provided in this Agreement.
              </p>
              <p className="mb-2">
                2. In the event that either Party wishes to terminate this Agreement, that Party will be required to provide at least 30 days' notice to the other Party.
              </p>
              <p className="mb-2">
                3. This Agreement may be terminated at any time by mutual agreement of the Parties.
              </p>
              <p>
                4. Except as otherwise provided in this Agreement, the obligations of the Contractor will end upon the termination of this Agreement.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Performance</h3>
              <p className="mb-2">
                1. The Parties agree to do everything necessary to ensure that the terms of this Agreement take effect.
              </p>
              <h4 className="font-bold mb-1">Currency</h4>
              <p className="mb-2">
                2. Except as otherwise provided in this Agreement, all monetary amounts referred to in this Agreement are in US Dollars.
              </p>
              <h4 className="font-bold mb-1">Compensation</h4>
              <p className="mb-2">
                3. The Compensation will be payable weekly on Fridays, while this Agreement is in force.
              </p>
              <p className="mb-2">
                4. The above Compensation includes all applicable sales tax, and duties as required by law.
              </p>
              <h4 className="font-bold mb-1">Reimbursement of Expenses</h4>
              <p className="mb-2">
                5. The Contractor will not be reimbursed for expenses incurred by the Contractor in connection with providing the Services of this Agreement.
              </p>
              <h4 className="font-bold mb-1">Additional Resources</h4>
              <p>
                6. The Client agrees to provide, for the use of the Contractor in providing the Services, the following resources: All Leads, and a weekly stipend of $40.00 for gas and other incidentals. Only applies if contractor cleans a minimum of 2 houses per week.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Confidentiality</h3>
              <p className="mb-2">
                7. Confidential information (the "Confidential Information") refers to any data or information relating to the Client, whether business or personal, which would reasonably be considered to be private or proprietary to the Client and that is not generally known and where the release of that Confidential Information could reasonably be expected to cause harm to the Client.
              </p>
              <p className="mb-2">
                8. The Contractor agrees that it will not disclose, divulge, reveal, report or use, for any purpose, any Confidential Information which the Contractor has obtained, except as authorized by the Client. This obligation will survive the expiration or termination of this Agreement and will continue indefinitely.
              </p>
              <p>
                9. All written and oral information and materials disclosed or provided by the Client to the Contractor under this Agreement is Confidential Information regardless of whether it was provided before or after the date of this Agreement or how it was provided to the Contractor.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Non-Competition</h3>
              <p>
                10. Other than with the express written consent of the Client, which will not be unreasonably withheld, the Contractor will not be directly or indirectly involved with a business which is in direct competition with the particular business line of the Client, divert or attempt to divert from the Client any business the Client has enjoyed, solicited, or attempted to solicit, from other individuals or corporations, prior to the expiration or termination of this Agreement. This obligation will survive the expiration or termination of this Agreement and will continue for five (5) years from the date of such expiration or termination.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Non-Solicitation</h3>
              <p className="mb-2">
                1. The Contractor understands and agrees that any attempt on the part of the Contractor to induce other employees or contractors to leave the Client's employ, or any effort by the Contractor to interfere with the Client's relationship with its employees or other service providers would be harmful and damaging to the Client.
              </p>
              <p className="mb-2">
                2. During the term of this Agreement and for a period of five (5) years after the expiration or termination of this Agreement, the Contractor will not in any way directly or indirectly:
              </p>
              <div className="ml-4 space-y-1">
                <p>a. induce or attempt to induce any employee or other service provider of the Client to quit employment or retainer with the Client; Contractor has no control and will not be held liable if client (customer) contacts them directly, however contractor has a moral obligation to inform Client (Bay Area Cleaning Professionals LLC)</p>
                <p>b. otherwise interfere with or disrupt the Client's relationship with its employees or other service provider</p>
                <p>c. discuss employment opportunities or provide information about competitive employment to any of the Client's employees or other service providers; or</p>
                <p>d. solicit, entice, or hire away any employee or other service provider of the Client.</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Ownership of Materials and Intellectual Property</h3>
              <p className="mb-2">
                3. All intellectual property and related materials (the "Intellectual Property") including any related work in progress that is developed or produced under this Agreement, will be the sole property of the Client. The use of the Intellectual Property by the Client will not be restricted in any manner.
              </p>
              <p className="mb-2">
                4. The Contractor may not use the Intellectual Property for any purpose other than that contracted for in this Agreement except with the written consent of the Client. The Contractor will be responsible for any and all damages resulting from the unauthorized use of the Intellectual Property.
              </p>
              <h4 className="font-bold mb-1">Return of Property</h4>
              <p className="mb-2">
                5. Upon the expiry or termination of this Agreement, the Contractor will return to the Client any property, documentation, records, or Confidential Information which is the property of the Client.
              </p>
              <h4 className="font-bold mb-1">Capacity/Independent Contractor</h4>
              <p className="mb-2">
                6. In providing the Services under this Agreement it is expressly agreed that the Contractor is acting as an independent contractor and not as an employee. The Contractor and the Client acknowledge that this Agreement does not create a partnership or joint venture between them, and is exclusively a contract for service.
              </p>
              <h4 className="font-bold mb-1">Notice</h4>
              <p>
                7. All notices, requests, demands or other communications required or permitted by the terms of this Agreement will be given in writing and delivered to the Parties of this Agreement as follows:
              </p>
              <div className="ml-4 space-y-1">
                <p>a. [CONTRACTOR ADDRESS]</p>
                <p>b. Bay Area Cleaning Professionals LLC 3210 Lancelot, Baytown, TX 77521, USA or to such other address as any Party may from time to time notify the other.</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Indemnification</h3>
              <p className="mb-2">
                1. Except to the extent paid in settlement from any applicable insurance policies, and to the extent permitted by applicable law, each Party agrees to indemnify and hold harmless the other Party, and its respective affiliates, officers, agents, employees, and permitted successors and assigns against any and all claims, losses, damages, liabilities, penalties, punitive damages, expenses, reasonable legal fees and costs of any kind or amount whatsoever, which result from or arise out of any act or omission of the indemnifying party, its respective affiliates, officers, agents, employees, and permitted successors and assigns that occurs in connection with this Agreement. This indemnification will survive the termination of this Agreement.
              </p>
              <h4 className="font-bold mb-1">Legal Expenses</h4>
              <p className="mb-2">
                2. In the event that legal action is brought to enforce or interpret any term of this Agreement, the prevailing Party will be entitled to recover, in addition to any other damages or award, all reasonable legal costs and fees associated with the action.
              </p>
              <h4 className="font-bold mb-1">Modification of Agreement</h4>
              <p className="mb-2">
                3. Any amendment or modification of this Agreement or additional obligation assumed by either Party in connection with this Agreement will only be binding if evidenced in writing signed by each Party or an authorized representative of each Party.
              </p>
              <h4 className="font-bold mb-1">Time of the Essence</h4>
              <p className="mb-2">
                4. Time is of the essence in this Agreement. No extension or variation of this Agreement will operate as a waiver of this provision.
              </p>
              <h4 className="font-bold mb-1">Assignment</h4>
              <p className="mb-2">
                5. The Contractor will not voluntarily, or by operation of law, assign or otherwise transfer its obligations under this Agreement without the prior written consent of the Client.
              </p>
              <h4 className="font-bold mb-1">Entire Agreement</h4>
              <p className="mb-2">
                6. It is agreed that there is no representation, warranty, collateral agreement or condition affecting this Agreement except as expressly provided in this Agreement.
              </p>
              <h4 className="font-bold mb-1">Enurement</h4>
              <p className="mb-2">
                7. This Agreement will be to the benefit of and be binding on the Parties and their respective heirs, executors, administrators, successors and permitted assigns.
              </p>
              <h4 className="font-bold mb-1">Titles/Headings</h4>
              <p className="mb-2">
                8. Headings are inserted for the convenience of the Parties only and are not to be considered when interpreting this Agreement.
              </p>
              <h4 className="font-bold mb-1">Gender</h4>
              <p>
                9. Words in the singular mean and include the plural and vice versa. Words in the masculine mean and include the feminine and vice versa.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Governing Law</h3>
              <p className="mb-2">
                1. It is the intention of the Parties to this Agreement that this Agreement and the performance under this Agreement, and all suits and special proceedings under this Agreement, be construed in accordance with and governed, to the exclusion of the law of any other forum, by the laws of Texas, without regard to the jurisdiction in which any action or special proceeding may be instituted.
              </p>
              <h4 className="font-bold mb-1">Severability</h4>
              <p className="mb-2">
                1. In the event that any of the provisions of this Agreement are held to be invalid or unenforceable in whole or in part, all other provisions will nevertheless continue to be valid and enforceable with the invalid or unenforceable parts severed from the remainder of this Agreement.
              </p>
              <h4 className="font-bold mb-1">Waiver</h4>
              <p>
                1. The waiver by either Party of a breach, default, delay or omission of any of the provisions of this Agreement by the other Party will not be construed as a waiver of any subsequent breach of the same or other provisions.
              </p>
            </div>

            <div className="text-center space-y-4 mt-8">
              <p className="font-bold">
                IN WITNESS WHEREOF the Parties have duly affixed their signatures under hand and seal on this _______________.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="space-y-4">
                  <p className="font-bold">BAY AREA CLEANING PROFESSIONALS</p>
                  <div className="border-b border-gray-400 pb-1">
                    <p className="text-xs">SIGNATURE:</p>
                  </div>
                  <div className="border-b border-gray-400 pb-1">
                    <p className="text-xs">DATE SIGNED:</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="font-bold">CONTRACTOR</p>
                  <div className="border-b border-gray-400 pb-1">
                    <p className="text-xs">SIGNATURE:</p>
                  </div>
                  <div className="border-b border-gray-400 pb-1">
                    <p className="text-xs">DATE SIGNED:</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ContractorAgreement;