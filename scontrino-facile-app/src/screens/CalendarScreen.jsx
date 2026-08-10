import ReceiptCalendar from '../components/ReceiptCalendar'

export default function CalendarScreen({ receipts, onOpen }) {
  return (
    <div className="screen">
      <div className="pad" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 18px)' }}>
        <h1 className="scr-title">Calendario</h1>
      </div>
      <ReceiptCalendar receipts={receipts} onOpen={onOpen} />
    </div>
  )
}
