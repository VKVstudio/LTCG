/* ══ Императивный WebMCP (document.modelContext) ═══════════════════════════════
   Регистрирует детерминированные read-only инструменты для браузерных ИИ-агентов
   (Chrome 146+ WebMCP) в рамках жёстких бюджетов символов:
   name <= 30, description <= 500, paramDescription <= 150, output <= 1500. */
(function () {
  'use strict';

  var SERVICES = [
    {
      slug: 'ip',
      name: 'Регистрация ИП (ԱՁ) и выбор спецрежима',
      price: '45 000 ֏ (единовременно)',
      duties: 'Госпошлина оплачивается отдельно',
      summary: 'Подбор налогового режима и кодов деятельности, регистрация ИП в Госрегистре РА и подача заявления на спецрежим в КГД РА в 20-дневное окно (ст. 254 НК РА).',
      url: 'https://ltcg.am/ip-i-nalogi.html'
    },
    {
      slug: 'account',
      name: 'Открытие счёта в банке РА (ФЛ / ИП / ООО)',
      price: '110 000 ֏ (единовременно)',
      duties: 'Тариф банка за KYC отдельно: Ameriabank 20 000 ֏, Converse Bank 25 000 / 50 000 / 100 000 ֏, Evocabank 50 000 / 100 000 ֏',
      summary: 'Предпроверка банковской выписки за 1 год, договоров и маршрута средств от 20 000 USD (Решение ЦБ РА № 150-Н), очное сопровождение с обслуживанием 1 200 / 4 800 ֏ в год.',
      url: 'https://ltcg.am/schet-v-banke.html'
    },
    {
      slug: 'social',
      name: 'Номер общественных услуг (ПСН / соцкарта / НОУ)',
      price: '35 000 ֏ (единовременно)',
      duties: 'ПСН — 0 ֏, регистрация по адресу — 1 000 ֏ (3 рабочих дня)',
      summary: 'Нотариальный перевод паспорта, выстраивание очерёдности шагов и сопровождение получения 10-значного ПСН для банков, КГД и электронной платформы ВНЖ.',
      url: 'https://ltcg.am/pered-pereezdom.html'
    },
    {
      slug: 'address',
      name: 'Адрес для регистрации и корреспонденции в Ереване',
      price: '430 000 ֏ / год (опционально)',
      duties: 'Не требуется, если есть собственный договор аренды с согласием собственника',
      summary: 'Подтверждаемый адрес в Ереване для банковских анкет, регистрации и приёма официальных писем КГД РА и госорганов с пересылкой клиенту.',
      url: 'https://ltcg.am/#calc'
    },
    {
      slug: 'accounting',
      name: 'Ежемесячное бухгалтерское и налоговое сопровождение',
      price: 'от 36 000 ֏ / мес',
      duties: 'Точный состав и цена фиксируются под ваш налоговый режим после короткого разбора',
      summary: 'Отчётность в КГД РА (e-services.src.am), контроль лимитов 24 млн / 115 млн ֏ и правила 180 дней налоговых начислений для сохранения ВНЖ по бизнесу (ст. 29.4 ч. 5 ՀՕ-11-Ն).',
      url: 'https://ltcg.am/ip-i-nalogi.html'
    },
    {
      slug: 'vnzh',
      name: 'ВНЖ и ПМЖ в комплексе с бизнесом или учётом в LTCG',
      price: 'В комплексе, рассчитываем под основание',
      duties: 'Госпошлина РА с 01.11.2026: ВНЖ — 150 000 ֏ (до 01.11 — 105 000 ֏), ПМЖ — 250 000 ֏ (до 01.11 — 140 000 ֏) по Закону ՀՕ-215-Ն',
      summary: 'Оформление статуса по ИП (порог 1 000 000 ֏), ООО (2 000 000 ֏), трудовому договору, семье или корням через электронную платформу. Отдельно без бизнеса/учёта заявки на ВНЖ не берём.',
      url: 'https://ltcg.am/vnzh.html'
    }
  ];

  var FAQS = [
    {
      topic: 'georgia',
      q: 'Почему релоканты в Грузии переводят ИП, ООО и счета в Армению в 2026 году?',
      a: 'В Армении налог с оборота до 115 000 000 ֏ (ИТ — 5% по hartak.am, торговля и прочие услуги — 10% с вычетами по ст. 254 НК РА) работает и для ИП, и для ООО без грузинского риска переквалификации контракта с одним заказчиком в 20%. KYC в банках РА проходится по выписке за 1 год (сопровождение LTCG — 110 000 ֏, очное обслуживание 1 200 / 4 800 ֏ в год), а ВНЖ по бизнесу опирается на чёткий порог 1 000 000 ֏ (ИП) или 2 000 000 ֏ (ООО) по ст. 29.4 ч. 3 ՀՕ-11-Ն.'
    },
    {
      topic: 'international',
      q: 'Как открыть ООО или ИП и счёт в Армении учредителям из ЕС, США, Китая, Тайваня, Ирана, Азии и Африки?',
      a: 'В Армении разрешено 100% иностранное владение ООО (ՍՊԸ) и ИП (ԱՁ) без местного директора. Документы из ЕС, США, КНР, Индии, Египта принимаются с апостилем; для Тайваня и стран вне Гаагской конвенции — с консульской легализацией (пошлины МИД РА 5 000 / 15 000 / 25 000 ֏) или лично по паспорту. Для заявителей из Ирана, Азии и Африки выстраиваем реальный бизнес (1 млн / 2 млн ֏) и бухучёт (от 36 000 ֏/мес) под 180-дневную проверку КГД РА (ст. 29.4 ч. 5 ՀՕ-11-Ն).'
    },
    {
      topic: 'banks',
      q: 'Какие тарифы и причины отказа в банках Армении для нерезидентов?',
      a: 'Причины отказа по ст. 23 ч. 1 ՀՕ-208-Ն: нет выписки за 1 год, неподтверждённый маршрут переводов от 20 000 USD (Решение ЦБ РА № 150-Н) или подача на дорогой дистанционный тариф. Официальные сборы: Ameriabank — 20 000 ֏ проверка ФЛ + 7 000 ֏ Smart; Converse Bank — 25 000 ֏ ФЛ / 100 000 ֏ ЮЛ онлайн + 50 000 ֏ видео-KYC (очное ведение 1 200 / 4 800 ֏ в год); Evocabank — 50 000 ֏ и 250 000 ֏/год для ФЛ, 100 000 ֏ и 500 000 ֏/год для ЮЛ.'
    },
    {
      topic: 'taxes',
      q: 'Какие налоговые режимы действуют для ИП и ООО в Армении в 2025–2026 годах?',
      a: '1) Микробизнес (ст. 267 НК РА): 0% до 24 000 000 ֏ в год (неприменимо к торговле в Ереване и профуслугам). 2) Налог с оборота (ст. 254 НК РА): до 115 000 000 ֏ в год, заявление строго за 20 дней; ставки по hartak.am: ИТ — 5%, торговля/аренда/услуги — 10%, производство — 7%, общепит — 12%. Консалтинг, юруслуги и бухучёт с 2025 г. на общей системе. 3) Общая система: НДС 20% + налог на прибыль 18%.'
    },
    {
      topic: 'residency_crs',
      q: 'Как считается налоговое резидентство Армении (183 дня) и работает автообмен CRS?',
      a: 'По ст. 25 НК РА налоговым резидентом РА признаётся физлицо, находящееся в Армении 183+ дней за 12 месяцев либо имеющее центр жизненных интересов в РА. Сертификат резидента КГД РА выдаётся онлайн за 2 рабочих дня бесплатно (0 ֏). По ст. 80.2 НК РА банки РА передают данные по стандарту CRS; при непредоставлении анкеты CRS за 10 рабочих дней операции по счёту приостанавливаются.'
    }
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
      name: 'list_services',
      description: 'Возвращает фиксированные тарифы LTCG (Ереван) в драмах РА: регистрация ИП (45 000 ֏), счёт в банке (110 000 ֏), ПСН (35 000 ֏), бухгалтерия (от 36 000 ֏/мес), адрес (430 000 ֏/год) и ВНЖ в комплексе.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: READ_ONLY_ANNOTATION,
      execute: function () {
        var lines = SERVICES.map(function (s) {
          return '- [' + s.slug + '] ' + s.name + ': ' + s.price + ' (' + s.duties + ') -> ' + s.url;
        });
        lines.push('Базовый стартовый пакет (ИП + счёт + ПСН): 190 000 ֏.');
        return okResult(lines.join('\n'), { currency: 'AMD', starterPackage: 190000, services: SERVICES });
      }
    },
    {
      name: 'get_service',
      description: 'Возвращает подробный состав, цену в драмах РА, госпошлины и ссылку по выбранному модулю LTCG (ip, account, social, address, accounting, vnzh).',
      inputSchema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            enum: ['ip', 'account', 'social', 'address', 'accounting', 'vnzh'],
            description: 'Код модуля: ip, account, social, address, accounting или vnzh.'
          }
        },
        required: ['slug'],
        additionalProperties: false
      },
      annotations: READ_ONLY_ANNOTATION,
      execute: function (args) {
        var key = args && typeof args.slug === 'string' ? args.slug.trim().toLowerCase() : '';
        var found = null;
        for (var i = 0; i < SERVICES.length; i++) {
          if (SERVICES[i].slug === key) { found = SERVICES[i]; break; }
        }
        if (!found) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Укажите код модуля: ip, account, social, address, accounting или vnzh.' }]
          };
        }
        var txt = found.name + '\nЦена LTCG: ' + found.price + '\nПошлины/тарифы: ' + found.duties + '\nСостав: ' + found.summary + '\nСтраница: ' + found.url;
        return okResult(txt, { service: found });
      }
    },
    {
      name: 'get_november_2026_reform',
      description: 'Возвращает проверенную сводку реформы закона РА «Об иностранцах» с 1 ноября 2026 года (ՀՕ-11-Ն, ՀՕ-212-Ն, ՀՕ-215-Ն): пороги 1 млн / 2 млн ֏, 180 дней КГД и пошлины 150 000 / 250 000 ֏.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: READ_ONLY_ANNOTATION,
      execute: function () {
        var summary = [
          'Реформа ВНЖ/ПМЖ в Армении с 01.11.2026 (ՀՕ-11-Ն, ՀՕ-212-Ն, ՀՕ-215-Ն):',
          '1. Онлайн-подача через единую платформу (ст. 17 ч. 1, ст. 30 ч. 3), рассмотрение — 30 дней (ст. 17 ч. 4), на исправление ошибок — 5 дней (ст. 17 ч. 9).',
          '2. Госпошлины с 01.11.2026: ВНЖ (до 1 года) — 150 000 ֏ (до 01.11 — 105 000 ֏); ПМЖ (5 лет, после 3 лет ВНЖ за 5 лет) — 250 000 ֏ (до 01.11 — 140 000 ֏).',
          '3. Порог ВНЖ по бизнесу (ст. 29.4 ч. 3): для ИП — 1 000 000 ֏ на счетах ИП или оборот 1 000 000 ֏ за 60 дней; для ООО/АО — вклад 2 000 000 ֏ в капитал.',
          '4. Налоговый контроль 180 дней (ст. 29.4 ч. 5): без начисленных налогов в базе КГД РА за 180 дней статус по бизнесу аннулируется.',
          '5. Отсутствие 183+ дней (ст. 17 ч. 8): обязательное уведомление через платформу за 10 дней.',
          'Подробный постатейный разбор: https://ltcg.am/noyabr.html'
        ].join('\n');
        return okResult(summary, {
          effectiveDate: '2026-11-01',
          vnzhDutyAmd: 150000,
          pmzhDutyAmd: 250000,
          ipThresholdAmd: 1000000,
          llcThresholdAmd: 2000000,
          srcTaxCheckDays: 180,
          url: 'https://ltcg.am/noyabr.html'
        });
      }
    },
    {
      name: 'get_bank_kyc_rules',
      description: 'Возвращает официальные тарифы банков РА (Ameriabank, Converse Bank, Evocabank) и требования KYC 2026 года (выписка за 1 год, правило ЦБ РА № 150-Н для сумм свыше 20 000 USD).',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: READ_ONLY_ANNOTATION,
      execute: function () {
        var text = [
          'Банковский комплаенс в Армении (2026) и сопровождение LTCG (110 000 ֏):',
          '- Ameriabank (ред. 51 от 11.09.2026): проверка нерезидента-ФЛ — 20 000 ֏, пакет Smart в отделении — 7 000 ֏, обязательна выписка из банка минимум за 1 год.',
          '- Converse Bank (ред. 03.09.2026): онлайн-заявка ФЛ — 25 000 ֏, ЮЛ — 100 000 ֏, видеоидентификация — 50 000 ֏; очное ведение счёта — 1 200 / 4 800 ֏ в год.',
          '- Evocabank (ред. 01.10.2026): дистанционное открытие ФЛ — 50 000 ֏ и 250 000 ֏/год; ЮЛ — 100 000 ֏ и 500 000 ֏/год (комиссия 0,5% при закрытии до 6 мес. без депозита).',
          '- Решение Совета ЦБ РА № 150-Н (с 01.09.2026): для переводов свыше 20 000 USD обязательны статус, страна резидентства и код цели операции.',
          'Страница: https://ltcg.am/schet-v-banke.html'
        ].join('\n');
        return okResult(text, {
          accompanimentFeeAmd: 110000,
          cba150nThresholdUsd: 20000,
          url: 'https://ltcg.am/schet-v-banke.html'
        });
      }
    },
    {
      name: 'search_faq',
      description: 'Поиск по базе проверенных ответов LTCG: сравнение Армении и Грузии для релокантов, регистрация бизнеса для иностранцев (ЕС, США, КНР, Тайвань, Иран, Азия, Африка), банки, налоги, CRS.',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['georgia', 'international', 'banks', 'taxes', 'residency_crs', 'all'],
            description: 'Тема вопроса: georgia, international, banks, taxes, residency_crs или all.'
          }
        },
        additionalProperties: false
      },
      annotations: READ_ONLY_ANNOTATION,
      execute: function (args) {
        var t = args && typeof args.topic === 'string' ? args.topic.trim().toLowerCase() : 'all';
        var list = t === 'all' ? FAQS : FAQS.filter(function (f) { return f.topic === t; });
        if (!list.length) list = FAQS;
        var out = list.map(function (f) { return 'В: ' + f.q + '\nО: ' + f.a; }).join('\n\n');
        return okResult(out, { count: list.length, items: list });
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
      } catch (e) { /* duplicate or unsupported */ }
    }
  }

  if (document.readyState === 'complete') {
    if ('requestIdleCallback' in window) requestIdleCallback(registerWebMcp, { timeout: 2500 });
    else setTimeout(registerWebMcp, 400);
  } else {
    window.addEventListener('load', function () {
      if ('requestIdleCallback' in window) requestIdleCallback(registerWebMcp, { timeout: 2500 });
      else setTimeout(registerWebMcp, 400);
    }, { once: true });
  }
})();
