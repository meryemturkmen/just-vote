GRANT UPDATE ON public.reports TO authenticated;
CREATE POLICY "Admins update reports" ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));