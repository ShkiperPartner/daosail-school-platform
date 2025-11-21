import { TopBar } from '@/components/layout/top-bar';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { RightSidebar } from '@/components/layout/right-sidebar';
import { Footer } from '@/components/layout/footer';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { AssistantDock } from '@/components/ui/assistant-dock';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 flex">
        <LeftSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden p-4 border-b">
            <MobileDrawer />
          </div>
          <div className="flex-1 flex">
            <div className="flex-1 overflow-auto">
              {children}
            </div>
            <div className="hidden xl:block">
              <RightSidebar />
            </div>
          </div>
        </main>
      </div>
      <div className="xl:hidden">
        <div className="border-t bg-muted/50 p-4">
          <RightSidebar />
        </div>
      </div>
      <Footer />

      {/* Assistant Dock - Always visible on all pages except chat */}
      <AssistantDock />
    </div>
  );
}