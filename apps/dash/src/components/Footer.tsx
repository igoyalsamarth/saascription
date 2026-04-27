export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground transition-colors">
      <p className="m-0">&copy; {year} Saascription</p>
    </footer>
  );
}
