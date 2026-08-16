"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check } from "pixelarticons/react";
import { useEffect, useRef, useState } from "react";
import { CreateMenu } from "./create-menu";
import { Header } from "./header";
import { ProfileMenu } from "./profile-menu";
import { SearchDialog } from "./search-dialog";
import { ShellContext, type ShellContextValue } from "./shell-context";
import { DesktopSidebar, MobileSidebar } from "./sidebar";

export function AppShell({
  userName,
  userImage,
  isSignedIn,
  workspaceName,
  workspaceLogo,
  isWorkspaceAdmin,
  children,
}: {
  userName: string;
  userImage: string | null;
  isSignedIn: boolean;
  workspaceName: string;
  workspaceLogo: string | null;
  isWorkspaceAdmin: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState({ messages: true });
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);

  const notify = (message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2800);
  };

  const navigate = (href: string) => {
    router.push(href);
    setShowMobileSidebar(false);
    setShowCreate(false);
  };

  const openCreate = () => {
    setShowMobileSidebar(false);
    setShowCreate(true);
  };

  const openSearch = () => {
    setShowMobileSidebar(false);
    setShowSearch(true);
  };

  const toggleProfile = () => setShowProfile((value) => !value);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowSearch(true);
      }
      if (event.key === "Escape") {
        setShowSearch(false);
        setShowCreate(false);
        setShowProfile(false);
        setShowMobileSidebar(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (pathname === "/messages" || pathname.startsWith("/messages/")) {
      setUnread((prev) => ({ ...prev, messages: false }));
    }
  }, [pathname]);

  const isMessagesPath =
    pathname === "/messages" || pathname.startsWith("/messages/");

  const value = {
    userName,
    userImage,
    isSignedIn,
    workspaceName,
    workspaceLogo,
    isWorkspaceAdmin,
    notify,
    navigate,
    unread,
    setUnread,
    openSearch,
    openCreate,
    toggleProfile,
  } satisfies ShellContextValue;

  return (
    <ShellContext.Provider value={value}>
      <div className="linear-workspace flex h-dvh overflow-hidden bg-[var(--bg-base-color)] text-[var(--color-text-secondary)]">
        <DesktopSidebar pathname={pathname} unread={unread} />
        {showMobileSidebar ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close workspace menu"
              className="absolute inset-0 bg-[#202024]/20"
              onClick={() => setShowMobileSidebar(false)}
            />
            <MobileSidebar
              pathname={pathname}
              unread={unread}
              onClose={() => setShowMobileSidebar(false)}
              onCreate={openCreate}
              onProfile={() => {
                setShowMobileSidebar(false);
                setShowProfile(true);
              }}
              onView={navigate}
            />
          </div>
        ) : null}
        <main className="flex min-w-0 flex-1 flex-col">
          <Header
            pathname={pathname}
            onOpenMobileSidebar={() => setShowMobileSidebar(true)}
          />
          {isMessagesPath ? (
            <div className="flex min-h-0 flex-1 px-5 pb-5 pt-3 sm:px-8">
              {children}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1380px] px-5 pb-14 pt-8 sm:px-8 lg:px-12">
                {children}
              </div>
            </div>
          )}
        </main>
        {showCreate ? (
          <CreateMenu
            onClose={() => setShowCreate(false)}
            onAction={notify}
            onNavigate={navigate}
          />
        ) : null}
        {showSearch ? (
          <SearchDialog
            onClose={() => setShowSearch(false)}
            onAction={notify}
            onNavigate={navigate}
          />
        ) : null}
        {showProfile ? (
          <ProfileMenu
            userName={userName}
            userImage={userImage}
            isSignedIn={isSignedIn}
            workspaceName={workspaceName}
            isWorkspaceAdmin={isWorkspaceAdmin}
            onClose={() => setShowProfile(false)}
          />
        ) : null}
        {notice ? (
          <div
            aria-live="polite"
            className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#232b42] px-4 py-3 text-[12px] font-medium text-white shadow-[0_12px_32px_rgba(35,43,66,0.2)]"
          >
            <Check className="size-4 text-[#aab1ff]" />
            {notice}
          </div>
        ) : null}
      </div>
    </ShellContext.Provider>
  );
}
