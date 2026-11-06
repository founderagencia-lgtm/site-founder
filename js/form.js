const clean = (value) => String(value ?? '').trim();

export function validate(values) {
  const errors = {};
  if (!clean(values.nome)) errors.nome = 'Informe seu nome.';
  if (!clean(values.empresa)) errors.empresa = 'Informe o nome da empresa.';
  return { ok: Object.keys(errors).length === 0, errors };
}

export function buildMessage(values) {
  const lines = [
    'Olá, Founder! Quero pedir um orçamento.',
    `Nome: ${clean(values.nome)}`,
    `Empresa: ${clean(values.empresa)}`,
    `Serviço: ${clean(values.servico)}`,
  ];
  const mensagem = clean(values.mensagem);
  if (mensagem) lines.push(`Mensagem: ${mensagem}`);
  return lines.join('\n');
}

export function buildWhatsappUrl(number, message) {
  const digits = String(number ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function showError(form, name, text) {
  const input = form.elements[name];
  const error = form.querySelector(`#${name}-erro`);
  error.textContent = text ?? '';
  error.hidden = !text;
  if (text) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

export function initForm(form, number) {
  const status = form.querySelector('#form-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const { ok, errors } = validate(values);
    showError(form, 'nome', errors.nome);
    showError(form, 'empresa', errors.empresa);
    status.textContent = '';
    if (!ok) {
      form.elements[errors.nome ? 'nome' : 'empresa'].focus();
      return;
    }

    const url = buildWhatsappUrl(number, buildMessage(values));
    if (!url) {
      status.textContent = 'O WhatsApp da Founder ainda não foi configurado neste site.';
      return;
    }
    status.textContent = 'Sua mensagem está pronta. Se o WhatsApp não abriu, ';
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'clique aqui para abrir';
    status.append(link, '.');
    window.open(url, '_blank', 'noopener');
  });
}
