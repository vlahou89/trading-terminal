import { useOrderStore } from "../../lib/state/orderStore";
import { useTick } from "../../lib/state/priceStore";
import type { Position } from "../../lib/state/orderTypes";
 
function PositionRow({ position }: { position: Position }) {
  const tick = useTick(position.symbol);
  const currentPrice = tick?.price;
 
  const pnl =
    currentPrice !== undefined
      ? position.side === "buy"
        ? (currentPrice - position.entryPrice) * position.quantity
        : (position.entryPrice - currentPrice) * position.quantity
      : null;
 
  const pnlPercent = pnl !== null ? (pnl / (position.entryPrice * position.quantity)) * 100 : null;
 
  return (
    <tr className="positions-table__row">
      <td>{position.symbol}</td>
      <td className={`positions-table__side positions-table__side--${position.side}`}>{position.side.toUpperCase()}</td>
      <td>{position.quantity}</td>
      <td>{position.entryPrice.toFixed(2)}</td>
      <td>{currentPrice !== undefined ? currentPrice.toFixed(2) : "—"}</td>
      <td className={pnl !== null && pnl >= 0 ? "positions-table__pnl--pos" : "positions-table__pnl--neg"}>
        {pnl !== null ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} (${pnlPercent!.toFixed(2)}%)` : "—"}
      </td>
    </tr>
  );
}
 
export function PositionsTable() {
  const positions = useOrderStore((state) => state.positions);
  const pendingOrders = useOrderStore((state) => state.pendingOrders);
  const cancelPendingOrder = useOrderStore((state) => state.cancelPendingOrder);
 
  return (
    <div className="positions-table">
      <h3 className="positions-table__heading">Open Positions</h3>
      {positions.length === 0 ? (
        <p className="positions-table__empty">No open positions yet.</p>
      ) : (
        <table>
          <thead><tr><th>Symbol</th><th>Side</th><th>Qty</th><th>Entry</th><th>Current</th><th>P&amp;L</th></tr></thead>
          <tbody>{positions.map((position) => <PositionRow key={position.id} position={position} />)}</tbody>
        </table>
      )}
      {pendingOrders.length > 0 && (
        <div className="positions-table__pending">
          <h3 className="positions-table__heading">Pending Limit Orders</h3>
          <ul>
            {pendingOrders.map((order) => (
              <li key={order.id}>
                {order.side.toUpperCase()} {order.quantity} {order.symbol} @ {order.limitPrice.toFixed(2)}
                <button onClick={() => cancelPendingOrder(order.id)}>Cancel</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
