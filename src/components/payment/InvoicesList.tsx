import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InvoiceRow {
  id: string;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  total_amount?: number | null;
  status?: string | null;
  pdf_url?: string | null;
}

const formatCurrency = (cents?: number | null) => {
  if (typeof cents !== 'number') return '-';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
};

export const InvoicesList: React.FC = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("id, invoice_number, invoice_date, due_date, total_amount, status, pdf_url")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isMounted) setInvoices(data as InvoiceRow[]);
      } catch (err) {
        console.error("Failed to load invoices", err);
        toast({
          title: "Unable to load invoices",
          description: "If this persists, contact support.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInvoices();
    return () => { isMounted = false; };
  }, [toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices & Receipts</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading invoices…</div>
        ) : invoices.length === 0 ? (
          <div className="text-sm text-muted-foreground">No invoices found.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invoice_number || '—'}</TableCell>
                    <TableCell>{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {inv.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.total_amount)}</TableCell>
                    <TableCell>
                      {inv.pdf_url ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" aria-label={`View receipt for invoice ${inv.invoice_number || ''}`}>
                            View PDF
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not available</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoicesList;
