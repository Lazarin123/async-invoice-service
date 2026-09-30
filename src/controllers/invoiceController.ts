import { Request, Response } from 'express';
import { invoiceQueue } from '../queues/invoiceQueue.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export class InvoiceController {
  static async requestInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { userId, amount } = req.body;

      if (!userId || !amount) {
        res.status(400).json({ error: 'userId e amount são obrigatórios.' });
        return;
      }

      // 1. Cria o registro inicial com status "PENDING" no Banco de Dados
      const { data, error } = await supabase
        .from('invoices')
        .insert([
          { user_id: userId, amount, status: 'PENDING' }
        ])
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: 'Erro ao criar registro no banco de dados', details: error.message });
        return;
      }

      const invoiceId = data.id;

      // 2. Adiciona a tarefa na Fila do BullMQ
      const job = await invoiceQueue.add('generate-pdf', {
        userId,
        invoiceId,
        amount,
      });

      // 3. Retorna imediatamente para o cliente (resposta rápida, sem travar o HTTP)
      res.status(202).json({
        message: 'Solicitação de fatura recebida e em processamento.',
        jobId: job.id,
        invoiceId: invoiceId,
        statusCheckUrl: `/invoices/${invoiceId}/status`
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro interno no servidor', details: err.message });
    }
  }

  static async checkStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        res.status(404).json({ error: 'Fatura não encontrada.' });
        return;
      }

      res.status(200).json(data);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar status', details: err.message });
    }
  }
}
