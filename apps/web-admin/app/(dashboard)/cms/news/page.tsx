"use client";

import { AdminApi } from "@/lib/api/admin-api";
import { CmsArticleManager } from "../_components/cms-article-manager";

export default function CmsNewsPage() {
  return (
    <CmsArticleManager
      type="news"
      title="Yangiliklar"
      addLabel="Yangilik qo'shish"
      emptyMessage="Yangiliklar topilmadi"
      loadItems={AdminApi.getCmsNews}
      publishOnSave
      createItem={AdminApi.createCmsNews}
      updateItem={AdminApi.updateCmsNews}
      setItemStatus={AdminApi.setCmsNewsStatus}
      deleteItem={AdminApi.deleteCmsNews}
    />
  );
}
