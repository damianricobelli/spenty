export const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="relative flex flex-col bg-background">{children}</main>
  );
};
