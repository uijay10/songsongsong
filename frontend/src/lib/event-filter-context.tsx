import { createContext, useContext, useState, type ReactNode } from "react";

export const NAV_KEY_TO_CATEGORY: Record<string, string> = {
  nav_testnet:   "测试网",
  nav_ido:       "IDO/Launchpad",
  nav_presale:   "预售",
  nav_funding:   "融资公告",
  nav_airdrop:   "空投",
  nav_recruiting:"招聘",
  nav_nodes:     "节点招募",
  nav_mainnet:   "主网上线",
  nav_unlock:    "代币解锁",
  nav_exchange:  "交易所上线",
  nav_quest:     "链上任务",
  nav_developer: "开发者专区",
};

interface EventFilterCtx {
  activeCategory: string;
  setActiveCategory: (c: string) => void;
}

const EventFilterContext = createContext<EventFilterCtx>({
  activeCategory: "全部",
  setActiveCategory: () => {},
});

export function EventFilterProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategory] = useState("全部");
  return (
    <EventFilterContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </EventFilterContext.Provider>
  );
}

export function useEventFilter() {
  return useContext(EventFilterContext);
}
