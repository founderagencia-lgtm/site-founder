import { buildWhatsappUrl } from './form.js';

export const QUESTIONS = [
  { id: 'site', service: 'Criação de sites', text: 'Sua empresa tem um site próprio?' },
  { id: 'busca', service: 'Google', text: 'Ela aparece no Google quando procuram pelo que você vende?' },
  { id: 'perfil', service: 'Google', text: 'O perfil da empresa no Google está completo e atualizado?' },
  { id: 'anuncios', service: 'Tráfego pago', text: 'Você faz anúncios pagos com acompanhamento?' },
  { id: 'redes', service: 'Redes sociais', text: 'Suas redes sociais recebem conteúdo com frequência?' },
];

export function summarize(answers) {
  const pending = QUESTIONS.filter((question) => answers[question.id] !== 'sim');
  return {
    total: QUESTIONS.length,
    done: QUESTIONS.length - pending.length,
    gaps: [...new Set(pending.map((question) => question.service))],
  };
}

export function buildDiagnosisMessage(answers, summary) {
  const lines = [
    'Olá, Founder! Fiz o diagnóstico no site.',
    `Resultado: ${summary.done} de ${summary.total} pontos em dia.`,
    ...QUESTIONS.map((question) => `${question.text} ${answers[question.id] === 'sim' ? 'Sim' : 'Não'}`),
  ];
  if (summary.gaps.length) lines.push(`Prioridades: ${summary.gaps.join(', ')}.`);
  return lines.join('\n');
}

function resultTitle({ done, total }) {
  if (done === total) return 'Sua base está em dia';
  if (done >= 3) return 'Você já tem uma boa base';
  return 'Há muito espaço para crescer';
}

export function initDiagnosis(root, number) {
  const quiz = root.querySelector('.diag-quiz');
  const result = root.querySelector('.diag-result');
  const counter = root.querySelector('.diag-count');
  const question = root.querySelector('.diag-question');
  const bar = root.querySelector('.diag-bar i');
  const gauge = root.querySelector('.gauge-value');
  const gaugeLabel = root.querySelector('.gauge-number');
  const title = root.querySelector('.diag-result-title');
  const gapList = root.querySelector('.diag-gaps');
  const send = root.querySelector('.diag-send');
  const circumference = 2 * Math.PI * 54;

  let index = 0;
  let answers = {};

  const showQuestion = () => {
    counter.textContent = `Pergunta ${index + 1} de ${QUESTIONS.length}`;
    question.textContent = QUESTIONS[index].text;
    bar.style.transform = `scaleX(${index / QUESTIONS.length})`;
    question.classList.remove('is-entering');
    void question.offsetWidth;
    question.classList.add('is-entering');
  };

  const showResult = () => {
    const summary = summarize(answers);
    quiz.hidden = true;
    result.hidden = false;
    title.textContent = resultTitle(summary);
    gaugeLabel.textContent = `${summary.done}/${summary.total}`;
    gapList.replaceChildren(...(summary.gaps.length ? summary.gaps : ['Manter e crescer']).map((gap) => {
      const item = document.createElement('li');
      item.textContent = gap;
      return item;
    }));
    gauge.style.strokeDasharray = String(circumference);
    gauge.style.strokeDashoffset = String(circumference);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      gauge.style.strokeDashoffset = String(circumference * (1 - summary.done / summary.total));
    }));
    const url = buildWhatsappUrl(number, buildDiagnosisMessage(answers, summary));
    send.href = url ?? '#orcamento';
    send.toggleAttribute('target', Boolean(url));
    if (url) send.target = '_blank';
    title.focus();
  };

  root.querySelectorAll('[data-answer]').forEach((button) => {
    button.addEventListener('click', () => {
      answers[QUESTIONS[index].id] = button.dataset.answer;
      index += 1;
      if (index < QUESTIONS.length) showQuestion();
      else showResult();
    });
  });

  root.querySelector('.diag-restart').addEventListener('click', () => {
    index = 0;
    answers = {};
    result.hidden = true;
    quiz.hidden = false;
    showQuestion();
    question.focus();
  });

  showQuestion();
}
