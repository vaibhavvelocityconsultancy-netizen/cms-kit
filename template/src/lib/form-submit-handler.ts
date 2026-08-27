export interface FormSubmitResult {
  ok: boolean;
  json: any;
}

/**
 * Submit a CMS form using multipart data when it contains files and JSON otherwise.
 */
export async function submitCmsForm(
  form: HTMLFormElement,
  apiPath: (path: string) => string,
): Promise<FormSubmitResult> {
  const hasFileInput = form.querySelector('input[type="file"]') !== null;
  let fetchOptions: RequestInit;

  if (hasFileInput) {
    const formData = new FormData(form);
    form
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((checkbox) => {
        formData.set(checkbox.name, checkbox.checked ? "true" : "false");
      });
    fetchOptions = { method: "POST", body: formData };
  } else {
    const data: Record<string, string> = {};
    new FormData(form).forEach((value, key) => {
      data[key] = value as string;
    });
    form
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((checkbox) => {
        data[checkbox.name] = checkbox.checked ? "true" : "false";
      });
    fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  }

  const slug = form.dataset.formSlug;
  const response = await fetch(
    apiPath(`/api/form/submit/${slug}`),
    fetchOptions,
  );
  const json = await response.json();

  return { ok: response.ok, json };
}
