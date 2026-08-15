import Icon from './Icon'
import { CATEGORY_MAP } from '../categories'
import { eur, relativeDate } from '../utils/format'
import { useI18n } from '../i18n'

export default function ReceiptRow({ receipt, onOpen }) {
  const { t } = useI18n()
  const cat = CATEGORY_MAP[receipt.category] || CATEGORY_MAP.altro
  return (
    <button className="row" onClick={() => onOpen(receipt.id)}>
      <span className="row-icon" style={{ background: `${cat.color}3d`, color: cat.color }}>
        <Icon name={cat.icon} size={19} />
      </span>
      <span className="row-mid">
        <span className="row-name">{receipt.merchant}</span>
        <span className="row-sub">{relativeDate(receipt.date)} · {t(`category.${cat.id}`)}</span>
      </span>
      <span className="row-amt">-{eur(receipt.total)}</span>
    </button>
  )
}
