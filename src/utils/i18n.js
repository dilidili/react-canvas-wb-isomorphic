import moment from 'moment'

export default function i18n() {
	moment.locale('zh', {
		relativeTime: {
			future: "%s内",
			past: "%s前",
			s: "几秒",
			m: "1分钟",
			mm: "%d分钟",
			h: "1小时",
			hh: "%d小时",
			d: "1天",
			dd: "%d天",
			M: "1个月",
			MM: "%d月",
			y: "1年",
			yy: "%d年"
		}
	})
}