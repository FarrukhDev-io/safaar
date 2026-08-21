"use client";

import { AdminApi } from "@/lib/api/admin-api";
import { CmsArticleManager } from "../_components/cms-article-manager";

export default function CmsOffersPage() {
  return (
    <CmsArticleManager
      type="offer"
      title="Maxsus takliflar"
      addLabel="Taklif qo'shish"
      emptyMessage="Takliflar topilmadi"
      loadItems={AdminApi.getCmsOffers}
      publishOnSave
      createItem={AdminApi.createCmsOffer}
      updateItem={AdminApi.updateCmsOffer}
      setItemStatus={AdminApi.setCmsOfferStatus}
      deleteItem={AdminApi.deleteCmsOffer}
    />
  );
}
