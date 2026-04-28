CREATE OR REPLACE FUNCTION public.mark_nps_google_review_intent(_response_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _google_url TEXT;
BEGIN
  IF _response_id IS NULL THEN
    RAISE EXCEPTION 'Resposta inválida';
  END IF;

  SELECT c.google_reviews_url INTO _google_url
  FROM public.nps_responses r
  JOIN public.companies c ON c.id = r.company_id
  WHERE r.id = _response_id
    AND c.is_active = true;

  IF _google_url IS NULL THEN
    RAISE EXCEPTION 'Resposta não encontrada';
  END IF;

  UPDATE public.nps_responses
  SET wants_google_review = true,
      redirected_to_google = true,
      updated_at = now()
  WHERE id = _response_id;

  RETURN true;
END;
$$;