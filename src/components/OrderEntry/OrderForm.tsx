import { useState } from "react";
import { useOrderStore } from "../../lib/state/orderStore";
import { useTick } from "../../lib/state/priceStore";
import type { OrderSide, OrderType } from "../../lib/state/orderTypes";
 
interface OrderFormProps {
  symbol: string;
}
 
export function OrderForm({ symbol }: OrderFormProps) {
  const tick = useTick(symbol);
  const placeOrder = useOrderStore((state) => state.placeOrder);
 
  const [side, setSide] = useState<OrderSide>("buy");
  const [type, setType] = useState<OrderType>("market");
  const [quantity, setQuantity] = useState("0.01");
  const [limitPrice, setLimitPrice] = useState("");
 
  const currentPrice = tick?.price;
  const canSubmit =
    currentPrice !== undefined &&
    parseFloat(quantity) > 0 &&
    (type === "market" || parseFloat(limitPrice) > 0);
 
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || currentPrice === undefined) return;
 
    placeOrder(
      {
        symbol, side, type,
        quantity: parseFloat(quantity),
        limitPrice: type === "limit" ? parseFloat(limitPrice) : undefined,
      },
      currentPrice
    );
    setLimitPrice("");
  }
 
  return (
    <form className="order-form" onSubmit={handleSubmit}>
      <div className="order-form__side-toggle">
        <button type="button" className={`order-form__side-btn order-form__side-btn--buy ${side === "buy" ? "is-active" : ""}`} onClick={() => setSide("buy")}>Buy</button>
        <button type="button" className={`order-form__side-btn order-form__side-btn--sell ${side === "sell" ? "is-active" : ""}`} onClick={() => setSide("sell")}>Sell</button>
      </div>
 
      <label className="order-form__field">
        <span>Order type</span>
        <select value={type} onChange={(e) => setType(e.target.value as OrderType)}>
          <option value="market">Market</option>
          <option value="limit">Limit</option>
        </select>
      </label>
 
      <label className="order-form__field">
        <span>Quantity</span>
        <input type="number" step="0.001" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </label>
 
      {type === "limit" && (
        <label className="order-form__field">
          <span>Limit price</span>
          <input type="number" step="0.01" min="0" placeholder={currentPrice?.toFixed(2) ?? "—"} value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
        </label>
      )}
 
      <div className="order-form__current-price">
        {currentPrice !== undefined ? `Current price: ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "Waiting for price feed…"}
      </div>
 
      <button type="submit" className={`order-form__submit order-form__submit--${side}`} disabled={!canSubmit}>
        {type === "market" ? `${side === "buy" ? "Buy" : "Sell"} at market` : `Place ${side} limit order`}
      </button>
    </form>
  );
}