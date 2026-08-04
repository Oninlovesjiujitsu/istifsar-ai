-- Extend the messages table to hold MLOps evaluation metrics
ALTER TABLE public.messages
ADD COLUMN faithfulness_score numeric,
ADD COLUMN relevancy_score numeric,
ADD COLUMN is_hallucination_flagged boolean DEFAULT false,
ADD COLUMN evaluation_status text DEFAULT 'pending';

-- Add a constraint to ensure valid evaluation states
ALTER TABLE public.messages
ADD CONSTRAINT messages_evaluation_status_check
CHECK (evaluation_status IN ('pending', 'completed', 'failed'));

-- Add comments for documentation
COMMENT ON COLUMN public.messages.faithfulness_score IS 'Score (0-1) from Ragas indicating if the answer is grounded in the retrieved context.';
COMMENT ON COLUMN public.messages.relevancy_score IS 'Score (0-1) from Ragas indicating if the answer directly addresses the user query.';
COMMENT ON COLUMN public.messages.is_hallucination_flagged IS 'True if a Historian manually flagged this message for evaluation.';
