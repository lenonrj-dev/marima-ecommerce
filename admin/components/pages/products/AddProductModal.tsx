"use client";

import Modal from "../../dashboard/Modal";
import { Button } from "../../dashboard/ui";
import ProductForm, { DraftProduct } from "./ProductForm";

export default function AddProductModal({
  open,
  onClose,
  draft,
  setDraft,
  errors,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  draft: DraftProduct;
  setDraft: (next: DraftProduct) => void;
  errors: Record<string, string>;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adicionar produto"
      description="Cadastro completo com imagens, descrições, preços, tags, status e estoque por tamanho."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onSubmit}>Salvar produto</Button>
        </>
      }
      size="xl"
    >
      <ProductForm draft={draft} setDraft={setDraft} errors={errors} />
    </Modal>
  );
}
