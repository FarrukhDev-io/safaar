import { PageTransition } from "@/components/layout/PageTransition";

export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
