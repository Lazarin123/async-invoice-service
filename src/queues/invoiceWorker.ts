import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

interface InvoiceJobData {
  userId: string;
  invoiceId: string;
  amount: number;
}

const worker = new Worker<InvoiceJobData>(
  'invoice-generation',
  async (job: Job<InvoiceJobData>) => {
    const { userId, invoiceId, amount } = job.data;
    
    console.log(`[Worker] Iniciando processamento da fatura ${invoiceId} para o usuário ${userId}...`);

    // Simulando uma tarefa pesada (ex: gerando PDF, consultando APIs externas, cálculos complexos)
    await new Promise((resolve) => setTimeout(resolve, 8000)); 

    const pdfUrlSimulation = `https://seu-bucket.supabase.co/storage/v1/object/public/invoices/${invoiceId}.pdf`;

    // Atualiza o status no PostgreSQL via Supabase
    // Certifique-se de ter uma tabela 'invoices' com colunas: id, user_id, status, pdf_url
    const { error } = await supabase
      .from('invoices')
      .update({ 
        status: 'COMPLETED', 
        pdf_url: pdfUrlSimulation,
        updated_at: new Date()
      })
      .eq('id', invoiceId);

    if (error) {
      throw new Error(`Erro ao atualizar Supabase: ${error.message}`);
    }

    console.log(`[Worker] Fatura ${invoiceId} gerada com sucesso!`);
    return { pdfUrl: pdfUrlSimulation };
  },
  { 
    connection: redisConnection,
    concurrency: 5 // Processa até 5 faturas simultaneamente neste worker
  }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ID ${job.id} concluído com sucesso.`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ID ${job?.id} falhou com o erro: ${err.message}`);
});

console.log('🚀 Worker de faturas rodando e aguardando tarefas...');
