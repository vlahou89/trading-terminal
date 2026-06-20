import { useEffect } from "react";
import { usePriceStore } from "./priceStore";
import { useOrderStore } from "./orderStore";
 
// Bridges two otherwise-independent stores: whenever a new tick lands in
// priceStore for a given symbol, ask orderStore to check whether any
// pending limit orders for that symbol have now crossed.
export function useOrderPriceBridge(symbols: string[]): void {
  const checkPendingOrders = useOrderStore((state) => state.checkPendingOrders);
 
  useEffect(() => {
    // Zustand's subscribe fires a callback on every store change WITHOUT
    // subscribing a React component to re-render on every tick — exactly
    // right here, since this hook renders nothing itself.
    const unsubscribe = usePriceStore.subscribe((state, prevState) => {
      for (const symbol of symbols) {
        const tick = state.ticks[symbol];
        const prevTick = prevState.ticks[symbol];
        if (tick && tick !== prevTick) {
          checkPendingOrders(symbol, tick.price);
        }
      }
    });
 
    return unsubscribe;
  }, [symbols, checkPendingOrders]);
}
