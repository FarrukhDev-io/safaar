"use client";

import { AdminApi } from "@/lib/api/admin-api";
import { CmsArticleManager } from "../_components/cms-article-manager";

export default function CmsPagesPage() {
  return (
    <CmsArticleManager
      type="page"
      title="Statik sahifalar"
      addLabel="Sahifa qo'shish"
      emptyMessage="Sahifalar topilmadi"
      loadItems={AdminApi.getCmsPages}
      publishOnSave
      createItem={AdminApi.createCmsPage}
      updateItem={AdminApi.updateCmsPage}
      setItemStatus={AdminApi.setCmsPageStatus}
      deleteItem={AdminApi.deleteCmsPage}
    />
  );
}
