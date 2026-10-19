(function () {
'use strict';
var SERVICES = [
  { slug: 'ip', name: 'Регистрация ИП (ԱՁ) и выбор спецрежима', priceAmd: 45000, price: '45 000 ֏', duties: 'Госпошлина оплачивается отдельно', summary: 'Подбор налогового режима, регистрация в Госрегистре РА и подача на спецрежим в 20 дней (ст. 254 НК РА).', url: 'https://ltcg.am/ip-i-nalogi.html' },
  { slug: 'account', name: 'Открытие счёта в банке РА (ФЛ / ИП / ООО)', priceAmd: 110000, price: '110 000 ֏', duties: 'KYC банков отдельно: Ameriabank 20 000 ֏, Converse 25k-100k ֏, Evocabank 50k-100k ֏', summary: 'Предпроверка выписки за 1 год, договоров и маршрута от 20 000 USD (Решение ЦБ РА № 150-Н), очное сопровождение.', url: 'https://ltcg.am/schet-v-banke.html' },
  { slug: 'social', name: 'Номер общественных услуг (ПСН / соцкарта)', priceAmd: 35000, price: '35 000 ֏', duties: 'ПСН 0 ֏, регистрация по адресу 1 000 ֏', summary: 'Нотариальный перевод паспорта, сопровождение получения 10-значного ПСН для банков и налоговой.', url: 'https://ltcg.am/pered-pereezdom.html' },
  { slug: 'address', name: 'Юридический адрес в Ереване на 1 год', priceAmd: 430000, price: '430 000 ֏', duties: 'Не требуется при собственном договоре аренды с согласием собственника', summary: 'Подтверждаемый адрес в Ереване для банковских анкет, регистрации бизнеса и корреспонденции.', url: 'https://ltcg.am/#calc' },
  { slug: 'accounting', name: 'Ежемесячный бухучёт и налоговый контроль', priceAmd: 36000, price: 'от 36 000 ֏ / мес', duties: 'Тариф зависит от оборота и режима', summary: 'Отчётность в КГД РА, контроль лимита 115 млн ֏ и правила 180 дней начислений для ВНЖ (ст. 29.4 ч. 5 ՀՕ-11-Ն).', url: 'https://ltcg.am/ip-i-nalogi.html' },
  { slug: 'vnzh', name: 'ВНЖ и ПМЖ в комплексе с бизнесом LTCG', priceAmd: 0, price: 'В комплексе с бизнесом', duties: 'Госпошлина с 01.11.2026: ВНЖ 150 000 ֏, ПМЖ 250 000 ֏ (Закон ՀՕ-215-Ն)', summary: 'Оформление статуса по ИП (порог 1 млн ֏) или ООО (2 млн ֏) через онлайн-платформу. Отдельно от бизнеса заявки не принимаем.', url: 'https://ltcg.am/vnzh.html' }
];

var READ_ONLY_ANNOTATION = Object.freeze({
  readOnlyHint: true,
  untrustedContentHint: true
});

function okResult(text, structured) {
  var out = String(text || '');
  if (out.length > 1480) out = out.slice(0, 1477) + '...';
  return {
    content: [{ type: 'text', text: out }],
    structuredContent: structured || {}
  };
}

var TOOLS = [
  {
    name: 'get_services',
    description: 'Returns the verified catalog of LTCG legal, tax, banking and relocation services in Armenia with current official prices in AMD, government duties, summaries and direct URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional service category filter: business, banking, tax, residence, or all.',
          enum: ['business', 'banking', 'tax', 'residence', 'all']
        }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY_ANNOTATION,
    execute: function (args) {
      var lines = SERVICES.map(function (s) {
        return '- [' + s.slug + '] ' + s.name + ': ' + s.price + ' (' + s.duties + ') -> ' + s.url;
      });
      lines.push('Recommended starter relocation package (IE registration + Bank Account KYC + SSN card): 190 000 ֏.');
      return okResult(lines.join('\n'), { currency: 'AMD', starterPackageAmd: 190000, services: SERVICES });
    }
  },
  {
    name: 'estimate_cost',
    description: 'Calculates the estimated legal consulting fee and official state duties in Armenian Drams (AMD) for selected business registration, banking and residence modules.',
    inputSchema: {
      type: 'object',
      properties: {
        include_ip: { type: 'boolean', description: 'Include Individual Entrepreneur (IE/ԱՁ) registration (45 000 ֏).' },
        include_bank: { type: 'boolean', description: 'Include Armenian bank account KYC pre-check & accompaniment (110 000 ֏).' },
        include_social: { type: 'boolean', description: 'Include Social Services Number (SSN/ПСН) card assistance (35 000 ֏).' },
        include_address: { type: 'boolean', description: 'Include 1-year verified legal address in central Yerevan (430 000 ֏).' },
        include_accounting: { type: 'boolean', description: 'Include first month of certified accounting & tax compliance (36 000 ֏).' }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY_ANNOTATION,
    execute: function (args) {
      var a = args || {};
      var total = 0;
      var breakdown = [];
      if (a.include_ip) { total += 45000; breakdown.push('IE Registration: 45 000 ֏'); }
      if (a.include_bank) { total += 110000; breakdown.push('Bank Account Accompaniment: 110 000 ֏'); }
      if (a.include_social) { total += 35000; breakdown.push('SSN/PSN Card: 35 000 ֏'); }
      if (a.include_address) { total += 430000; breakdown.push('Legal Address 1 Year: 430 000 ֏'); }
      if (a.include_accounting) { total += 36000; breakdown.push('Monthly Accounting (month 1): 36 000 ֏'); }
      if (!breakdown.length) {
        total = 190000;
        breakdown.push('Starter Package (IE + Bank + SSN): 190 000 ֏');
      }
      var outText = 'Estimated LTCG Fee: ' + total.toLocaleString('ru-RU') + ' ֏\nItems:\n' + breakdown.join('\n') + '\nGovernment duties (e.g. residence permit 150 000 ֏, bank KYC 20k-100k ֏) are paid separately to authorities.';
      return okResult(outText, { totalAmd: total, breakdown: breakdown, currency: 'AMD' });
    }
  },
  {
    name: 'request_consultation',
    description: 'Pre-fills the consultation request form on the page for client review. Does not transmit data or contact third parties; user submits the form manually.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Client name or company name.' },
        contact: { type: 'string', description: 'Client Telegram username (@username) or phone number for callback.' },
        task_profile: {
          type: 'string',
          description: 'Consultation topic profile.',
          enum: ['pre-move', 'arrived', 'legalizing', 'working', 'settled', 'moving-on', 'new-rules']
        },
        message: { type: 'string', description: 'Brief description of current business situation or legal question.' }
      },
      required: ['name', 'contact'],
      additionalProperties: false
    },
    annotations: READ_ONLY_ANNOTATION,
    execute: function (args) {
      var a = args || {};
      try {
        var fName = document.getElementById('f-name');
        var fContact = document.getElementById('f-contact');
        var fState = document.getElementById('f-state');
        var fMsg = document.getElementById('f-msg');
        if (fName && a.name) fName.value = a.name;
        if (fContact && a.contact) fContact.value = a.contact;
        if (fState && a.task_profile) fState.value = a.task_profile;
        if (fMsg && a.message) fMsg.value = a.message;
        var form = document.getElementById('lead');
        if (form && typeof form.scrollIntoView === 'function') {
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (err) {}
      return okResult('Consultation inquiry pre-filled on page. The client may review the fields and submit when ready.', { prefilled: true, clientName: a.name });
    }
  }
];

function registerWebMcp() {
  if (typeof document === 'undefined' || !('modelContext' in document)) return;
  var ctx = document.modelContext;
  if (!ctx || typeof ctx.registerTool !== 'function') return;
  if (window.__ltcgWebMcpRegistered) return;
  window.__ltcgWebMcpRegistered = true;
  for (var i = 0; i < TOOLS.length; i++) {
    try {
      ctx.registerTool(TOOLS[i]);
    } catch (e) {
      console.warn('[WebMCP] registration error:', e);
    }
  }
}

// Synchronous immediate registration if document.modelContext is present, else on DOMContentLoaded & load
registerWebMcp();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerWebMcp, { once: true });
}
window.addEventListener('load', registerWebMcp, { once: true });
})();
