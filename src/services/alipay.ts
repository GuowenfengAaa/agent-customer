export function submitAlipayForm(markup: string) {
  const paymentContent = markup.trim();
  if (!paymentContent) {
    throw new Error('支付宝支付表单为空，请稍后重试');
  }

  if (/^https:\/\//i.test(paymentContent)) {
    window.location.assign(paymentContent);
    return;
  }

  const parsed = new DOMParser().parseFromString(paymentContent, 'text/html');
  const source = parsed.querySelector('form');
  if (!source) throw new Error('支付宝支付表单无效，请稍后重试');

  const action = source.getAttribute('action') || '';
  if (!/^https:\/\//i.test(action)) throw new Error('支付宝收银台地址无效，请稍后重试');

  const form = document.createElement('form');
  form.method = source.getAttribute('method') || 'post';
  form.action = action;
  form.target = source.getAttribute('target') || '_self';
  source.querySelectorAll('input').forEach((input) => {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = input.name;
    field.value = input.value;
    form.appendChild(field);
  });
  document.body.appendChild(form);
  HTMLFormElement.prototype.submit.call(form);
}
