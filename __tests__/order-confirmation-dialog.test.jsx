import { fireEvent, render, screen } from "@testing-library/react";

import OrderConfirmationDialog from "../app/user/cart/components/OrderConfirmationDialog";
import { LanguageProvider } from "../context/LanguageContext";

function renderDialog(overrides = {}) {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  render(
    <LanguageProvider>
      <OrderConfirmationDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        itemCount={2}
        fulfillmentLabel="التوصيل"
        addressLabel="عنوان التوصيل"
        address="القاهرة - العبور"
        paymentMethodLabel="الدفع عند الاستلام"
        total="1,050 ج.م"
        {...overrides}
      />
    </LanguageProvider>,
  );

  return { onClose, onConfirm };
}

describe("order confirmation dialog", () => {
  it("asks for confirmation and shows the order summary", () => {
    renderDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("تأكيد عملية الشراء")).toBeInTheDocument();
    expect(screen.getByText("القاهرة - العبور")).toBeInTheDocument();
    expect(screen.getByText("1,050 ج.م")).toBeInTheDocument();
  });

  it("does not place the order until the confirm button is pressed", () => {
    const { onConfirm } = renderDialog();

    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "تأكيد الطلب" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes without creating the order from the edit button or Escape", () => {
    const { onClose, onConfirm } = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "تعديل الطلب" }));
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
