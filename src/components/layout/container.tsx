export const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      {children}
    </main>
  );
};
