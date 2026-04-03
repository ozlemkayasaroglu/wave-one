import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import newsRouter from './routes/news';
import summarizeRouter from './routes/summarize';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'wave-one-api' }));
app.use('/api/news', newsRouter);
app.use('/api/summarize', summarizeRouter);

app.listen(PORT, () => {
  console.log(`Wave:one API running on port ${PORT}`);
});
