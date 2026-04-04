import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Web3Provider } from "@/lib/web3";
import { LanguageProvider } from "@/lib/i18n";
import { Layout } from "@/components/layout";
import { EventFilterProvider } from "@/lib/event-filter-context";

import Home from "@/pages/home";
import Showcase from "@/pages/showcase";
import KOLZone from "@/pages/kol";
import DeveloperColumn from "@/pages/developer";
import Community from "@/pages/community";
import Profile from "@/pages/profile";
import PublicProfile from "@/pages/profile-public";
import ApplySpace from "@/pages/apply";
import PostNew from "@/pages/post-new";
import PostDetail from "@/pages/post-detail";
import ProjectDetail from "@/pages/project-detail";
import SectionPage from "@/pages/section";
import AdminPage from "@/pages/admin";
import MembersPage from "@/pages/members";
import AboutPage from "@/pages/about";
import NotFound from "@/pages/not-found";

/** Relative `base` (e.g. `./`) breaks wouter path matching; root must be `""` not `"/"`. */
function routerBase(): string {
  const raw = import.meta.env.BASE_URL ?? "/";
  if (raw.startsWith(".")) return "";
  if (raw === "/" || raw === "") return "";
  return raw.replace(/\/$/, "");
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/showcase" component={Showcase} />
      <Route path="/kol" component={KOLZone} />
      <Route path="/developer" component={DeveloperColumn} />
      <Route path="/community" component={Community} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:wallet" component={PublicProfile} />
      <Route path="/apply" component={ApplySpace} />
      <Route path="/post/new" component={PostNew} />
      <Route path="/post/:id" component={PostDetail} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/section/:slug" component={SectionPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/members" component={MembersPage} />
      <Route path="/about" component={AboutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const useHash =
    import.meta.env.VITE_SPA_HASH_ROUTER === "1" ||
    import.meta.env.VITE_SPA_HASH_ROUTER === "true";
  return (
    <Web3Provider>
      <LanguageProvider>
        <EventFilterProvider>
          <WouterRouter
            {...(useHash ? { hook: useHashLocation } : {})}
            base={routerBase()}
          >
            <Layout>
              <Router />
            </Layout>
          </WouterRouter>
        </EventFilterProvider>
      </LanguageProvider>
    </Web3Provider>
  );
}

export default App;
