'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductDetail, Cart, CustomerLogin } from '@/frontend/route-params';
import { useUserSession } from '@/tools/FrontendSession';
import { toast } from "sonner";
import { getProductDetail, getRelatedProducts, addToCart } from '@/frontend/actions/ProductDetail';
import type { ProductStatus, StockStatus, ProductDetailData, RelatedProductItem, ProductSkuData, GalleryItem } from '@/frontend/actions/ProductDetail';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ===== 枚举映射 =====
const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: '草稿',
  ACTIVE: '上架',
  INACTIVE: '下架'
};
const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  IN_STOCK: '有货',
  LOW_STOCK: '库存不足',
  OUT_OF_STOCK: '缺货'
};
export default function ProductDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    productId,
    slug
  } = useMemo(() => ProductDetail.getParams(searchParams), [searchParams]);
  const session = useUserSession();

  // ===== State =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductItem[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedSku, setSelectedSku] = useState<ProductSkuData | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // ===== Effects =====
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductDetail({
        productId,
        slug
      });
      setProduct(data.product);
      setActiveImage(data.product.mainImageUrl);

      // Load related products
      const relatedData = await getRelatedProducts({
        categoryId: data.product.categoryId,
        excludeProductId: data.product.id
      });
      setRelatedProducts(relatedData.list);
    } catch (err: any) {
      setError(err.message || '获取商品详情失败');
    } finally {
      setLoading(false);
    }
  }, [productId, slug]);
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // 当商品加载完成后，初始化默认选中的 SKU (优先选择有库存的)
  useEffect(() => {
    if (product && product.skus && product.skus.length > 0) {
      const defaultSku = product.skus.find(s => s.stock > 0) || product.skus[0];
      setSelectedSku(defaultSku);
      if (defaultSku.imageUrl) {
        setActiveImage(defaultSku.imageUrl);
      }
      const initAttrs: Record<string, string> = {};
      defaultSku.attributeJson?.forEach(attr => {
        if (attr.name && attr.value) {
          initAttrs[attr.name] = attr.value;
        }
      });
      setSelectedAttributes(initAttrs);
    }
  }, [product]);

  // ===== 派生数据 =====
  // 提取所有可供选择的 SKU 规格及其对应的值
  const availableAttributes = useMemo(() => {
    if (!product) return [];
    const attrMap = new Map<string, Set<string>>();
    product.skus?.forEach(sku => {
      sku.attributeJson?.forEach(attr => {
        if (attr.name && attr.value) {
          if (!attrMap.has(attr.name)) {
            attrMap.set(attr.name, new Set());
          }
          attrMap.get(attr.name)!.add(attr.value);
        }
      });
    });
    return Array.from(attrMap.entries()).map(([name, values], index) => ({
      name,
      values: Array.from(values)
    }));
  }, [product]);

  // 排序相册
  const sortedGallery = useMemo(() => {
    if (!product) return [];
    const mainImg: GalleryItem = {
      url: product.mainImageUrl,
      sort: -1
    };
    const extraImgs = (product.galleryJson || []).filter(item => item.url).sort((a, b) => (a.sort || 0) - (b.sort || 0));
    return [mainImg, ...extraImgs];
  }, [product]);

  // ===== Handlers =====
  const handleAttributeSelect = (name: string, value: string) => {
    if (product?.status !== 'ACTIVE') return;
    const newAttrs = {
      ...selectedAttributes,
      [name]: value
    };
    setSelectedAttributes(newAttrs);

    // 寻找完全匹配所选规格的 SKU
    const matchedSku = product?.skus?.find(sku => {
      return sku.attributeJson?.every(attr => {
        return attr.name && newAttrs[attr.name] === attr.value;
      });
    }) || null;
    setSelectedSku(matchedSku);
    if (matchedSku) {
      if (matchedSku.imageUrl) {
        setActiveImage(matchedSku.imageUrl);
      }
      setQuantity(1);
    }
  };
  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (!selectedSku) return;
    if (type === 'inc') {
      if (quantity < selectedSku.stock) setQuantity(prev => prev + 1);else toast.warning(`库存上限为 ${selectedSku.stock}`);
    } else {
      if (quantity > 1) setQuantity(prev => prev - 1);
    }
  };
  const handleAddToCart = async () => {
    if (!session.token) {
      toast.info('请先登录即可加入购物车');
      // 跳转登录页并携带 returnTo 逻辑
      let returnPath = ProductDetail.path;
      if (productId) returnPath += `?productId=${productId}`;else if (slug) returnPath += `?slug=${slug}`;
      CustomerLogin.navigateToWithReturn(router, {
        returnTo: returnPath
      });
      return;
    }
    if (!selectedSku) {
      toast.error('请选择有效的规格组合');
      return;
    }
    try {
      setSubmitting(true);
      await addToCart({
        productSkuId: selectedSku.id,
        quantity
      });
      toast.success('加入购物车成功');
      Cart.navigateTo(router);
    } catch (err: any) {
      toast.error(err.message || '加入购物车失败');
    } finally {
      setSubmitting(false);
    }
  };
  const handleRelatedClick = (id: string) => {
    ProductDetail.navigateToById(router, {
      productId: id
    });
  };

  // ===== Render =====
  if (loading) {
    return <div data-api-unique-id='productdetailview-skeleton-with-logic-rf1ea21fa11cc2355-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>正在加载商品详情...</div>;
  }
  if (error) {
    return <div data-api-unique-id='productdetailview-skeleton-with-logic-r437e3490029609d1-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>加载失败: {error}</div>;
  }
  if (!product) {
    return <div data-api-unique-id='productdetailview-skeleton-with-logic-r4212d5c5b0921d1e-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>未找到指定商品</div>;
  }
  const isPurchasable = product.status === 'ACTIVE';
  const isSkuValid = !!selectedSku;
  const isStockAvailable = selectedSku && selectedSku.stock > 0;
  return <article data-api-unique-id='productdetailview-skeleton-with-logic-r1ef9b4ae38a6c9b3-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
      {/* 警告横幅 */}
      {!isPurchasable && <Alert variant="destructive" data-api-unique-id='productdetailview-skeleton-with-logic-rca1e18c9c7d02a46-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
          <AlertTitle data-api-unique-id='productdetailview-skeleton-with-logic-r2a55eeaf6e302f36-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>不可购买</AlertTitle>
          <AlertDescription data-api-unique-id='productdetailview-skeleton-with-logic-r520b3e871852bc8f-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>该商品目前处于 {PRODUCT_STATUS_LABELS[product.status]} 状态，暂不支持浏览详情及加入购物车。</AlertDescription>
        </Alert>}

      {/* 模块一：核心交易视窗 */}
      <section data-api-unique-id='productdetailview-skeleton-with-logic-rbe59b96149e22b04-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
        {/* 左栏：标准化媒体阵列 */}
        <div data-api-unique-id='productdetailview-skeleton-with-logic-r084a11137659ea7f-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
          <div data-api-unique-id='productdetailview-skeleton-with-logic-r81f3fea80940348d-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            <img src={activeImage} alt={product.name} data-api-unique-id='productdetailview-skeleton-with-logic-r6076a348b091a7b6-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' />
          </div>
          <div data-api-unique-id='productdetailview-skeleton-with-logic-r9a62b2cd4bbb0b3a-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            {sortedGallery.map((item, index) => <button key={index} onClick={() => {
            if (item.url) setActiveImage(item.url);
          }} data-api-unique-id='productdetailview-skeleton-with-logic-rb58d742e5f15d4fc-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                {item.url && <img src={item.url} alt={`缩略图 ${index + 1}`} data-api-unique-id='productdetailview-skeleton-with-logic-r489fe2796b4dcbc3-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' />}
              </button>)}
          </div>
        </div>

        {/* 右栏：转化漏斗 */}
        <div data-api-unique-id='productdetailview-skeleton-with-logic-ra3ff27070551e4f3-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
          <div data-api-unique-id='productdetailview-skeleton-with-logic-r10141312b7b14a46-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            <h1 data-api-unique-id='productdetailview-skeleton-with-logic-rd57e41386500091c-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>{product.name}</h1>
            <p data-api-unique-id='productdetailview-skeleton-with-logic-r45c63a44dba23cb1-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>SKU Code: {product.productCode}</p>
            <div data-api-unique-id='productdetailview-skeleton-with-logic-r244ba6fbe7c7e5a3-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
              <span data-api-unique-id='productdetailview-skeleton-with-logic-r771c1fc0f6bc3948-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>评分: {product.ratingAverage} / 5</span>
              <span data-api-unique-id='productdetailview-skeleton-with-logic-r41e9fbd6c2a9d7dc-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>评价数: {product.ratingCount}</span>
            </div>
          </div>

          <Separator data-api-unique-id='productdetailview-skeleton-with-logic-rd122de6b49efa4c4-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' />

          <div data-api-unique-id='productdetailview-skeleton-with-logic-r27669db4af9db823-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            {selectedSku ? <div data-api-unique-id='productdetailview-skeleton-with-logic-rc5d677e894f09aff-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                <h2 data-api-unique-id='productdetailview-skeleton-with-logic-rd6beb14646f2abab-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>售价: {selectedSku.price.toFixed(2)}</h2>
                {selectedSku.originalPrice && selectedSku.originalPrice > selectedSku.price && <p data-api-unique-id='productdetailview-skeleton-with-logic-r690bbed1d042cf4d-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                    <s data-api-unique-id='productdetailview-skeleton-with-logic-rfbd5f748d602d22a-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>原价: {selectedSku.originalPrice.toFixed(2)}</s>
                    <Badge data-api-unique-id='productdetailview-skeleton-with-logic-r9da3d2601f626ae7-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>折扣特惠</Badge>
                  </p>}
                <div data-api-unique-id='productdetailview-skeleton-with-logic-r89cde6376fe88c6e-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                  <p data-api-unique-id='productdetailview-skeleton-with-logic-r01c5f95007e22382-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>发货地: {product.tradeInfoJson?.shipFrom || '以实际为准'}</p>
                  <p data-api-unique-id='productdetailview-skeleton-with-logic-ra7a8ae0b927540bf-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>预计交期: {selectedSku.deliveryDays || product.tradeInfoJson?.deliveryDays || '--'} 天</p>
                  <p data-api-unique-id='productdetailview-skeleton-with-logic-r0260bc651e2084b2-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>最小起订量: {product.tradeInfoJson?.minOrderQty || 1}</p>
                </div>
              </div> : <p data-api-unique-id='productdetailview-skeleton-with-logic-r7bdfed1ba59e982a-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>请选择具体的规格组合查看详细信息</p>}
          </div>

          <Separator data-api-unique-id='productdetailview-skeleton-with-logic-r635c40e5b402f182-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' />

          <div data-api-unique-id='productdetailview-skeleton-with-logic-rf8d7135e26fe70c1-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            {availableAttributes.map((attrGroup, index) => <div key={attrGroup.name} data-api-unique-id='productdetailview-skeleton-with-logic-r1935d891bc7e04e7-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                <h3 data-api-unique-id='productdetailview-skeleton-with-logic-r85aa10cc82599f9f-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`availableAttributes-${index}-name`} data-api-map-var-name='attrGroup'>{attrGroup.name}</h3>
                <div data-api-unique-id='productdetailview-skeleton-with-logic-r70fe49d1509a67ef-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                  {attrGroup.values.map((val, index1) => {
                const isSelected = selectedAttributes[attrGroup.name!] === val;
                return <Button key={val} variant={isSelected ? "default" : "outline"} disabled={!isPurchasable} onClick={() => handleAttributeSelect(attrGroup.name!, val)} data-api-unique-id='productdetailview-skeleton-with-logic-r93c294841231163c-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`availableAttributes-${index}-attrGroup.values-${index1}-$item`} data-api-map-var-name='val'>
                        {val}
                      </Button>;
              })}
                </div>
              </div>)}
          </div>

          <Separator data-api-unique-id='productdetailview-skeleton-with-logic-rdbb376dc911d921c-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' />

          <div data-api-unique-id='productdetailview-skeleton-with-logic-r556b2ec8e524e1ba-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            <div data-api-unique-id='productdetailview-skeleton-with-logic-ree6d2fe9d9a67840-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
              <span data-api-unique-id='productdetailview-skeleton-with-logic-r2427c3ea44a4b0f2-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>当前库存状态: {selectedSku ? STOCK_STATUS_LABELS[selectedSku.stockStatus] : '--'}</span>
              {selectedSku && <span data-api-unique-id='productdetailview-skeleton-with-logic-r2229ddf1bbc3082a-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'> (剩余 {selectedSku.stock})</span>}
            </div>
            <div data-api-unique-id='productdetailview-skeleton-with-logic-r86067d0146d42081-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
              <Button variant="outline" disabled={!isPurchasable || !isSkuValid || quantity <= 1} onClick={() => handleQuantityChange('dec')} data-api-unique-id='productdetailview-skeleton-with-logic-r68a218062037d817-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                -
              </Button>
              <Input value={quantity} readOnly disabled={!isPurchasable || !isSkuValid} data-api-unique-id='productdetailview-skeleton-with-logic-rf47baddf54bba2e9-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' />
              <Button variant="outline" disabled={!isPurchasable || !isSkuValid || selectedSku && quantity >= selectedSku.stock || false} onClick={() => handleQuantityChange('inc')} data-api-unique-id='productdetailview-skeleton-with-logic-r66ca364ab8a25410-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                +
              </Button>
            </div>
            
            <Button disabled={!isPurchasable || !isSkuValid || !isStockAvailable || submitting} onClick={handleAddToCart} data-api-unique-id='productdetailview-skeleton-with-logic-rddc17b38a2efb5c5-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
              {submitting ? '处理中...' : '加入购物车'}
            </Button>
            
            {!session.token && <p data-api-unique-id='productdetailview-skeleton-with-logic-r6ab62958d8eb4829-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>GUEST 用户点击将引导登录 / 登录后获取专属服务</p>}
            
            <div data-api-unique-id='productdetailview-skeleton-with-logic-rfead0b140de77722-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
              <p data-api-unique-id='productdetailview-skeleton-with-logic-r7534f85266157714-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>安全支付保障 | 支持全球主流物流渠道</p>
            </div>
          </div>
        </div>
      </section>

      {/* 模块二：深度信息矩阵 */}
      <section data-api-unique-id='productdetailview-skeleton-with-logic-re0f942d910cc6dac-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
        <nav data-api-unique-id='productdetailview-skeleton-with-logic-rbcd55adce6205819-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
          <ul data-api-unique-id='productdetailview-skeleton-with-logic-r5621b5e74b755ff9-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            <li data-api-unique-id='productdetailview-skeleton-with-logic-r666c8c7c588656ae-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'><a href="#section-content" data-api-unique-id='productdetailview-skeleton-with-logic-r76c3d22f1eb904bb-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>图文详情</a></li>
            <li data-api-unique-id='productdetailview-skeleton-with-logic-r0ba7bfad96725737-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'><a href="#section-specs" data-api-unique-id='productdetailview-skeleton-with-logic-re29634420cb7b796-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>规格参数</a></li>
            <li data-api-unique-id='productdetailview-skeleton-with-logic-r99e0862a6083ac0e-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'><a href="#section-trade" data-api-unique-id='productdetailview-skeleton-with-logic-r864cdd39e5ca9d7c-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>物流与贸易</a></li>
            <li data-api-unique-id='productdetailview-skeleton-with-logic-r0a92f7c82538603c-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'><a href="#section-faq" data-api-unique-id='productdetailview-skeleton-with-logic-r5afa6ac2dfe17faf-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>评价与问答</a></li>
          </ul>
        </nav>

        <div data-api-unique-id='productdetailview-skeleton-with-logic-rcadf36e32343a304-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
          {/* 图文详情 */}
          <div id="section-content" data-api-unique-id='productdetailview-skeleton-with-logic-rae716eba5fdbe8b4-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            <h2 data-api-unique-id='productdetailview-skeleton-with-logic-rd944bf653d867087-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>图文详情</h2>
            {product.sellingPointsJson && product.sellingPointsJson.length > 0 && <ul data-api-unique-id='productdetailview-skeleton-with-logic-rfec7c033ed902d8c-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                {product.sellingPointsJson.map((sp, index) => <li key={index} data-api-unique-id='productdetailview-skeleton-with-logic-r5931107bfd7edc45-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`product.sellingPointsJson-${index}-content`} data-api-map-var-name='sp'>
                    <strong data-api-unique-id='productdetailview-skeleton-with-logic-rda9993a7ca8df59c-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`product.sellingPointsJson-${index}-title`} data-api-map-var-name='sp'>{sp.title}</strong>: {sp.content}
                  </li>)}
              </ul>}
            
            {product.detailContentJson && product.detailContentJson.length > 0 ? <div data-api-unique-id='productdetailview-skeleton-with-logic-r74e0e45a5deb8a7e-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                {product.detailContentJson.map((block, index) => <div key={index} data-api-unique-id='productdetailview-skeleton-with-logic-rfcee2991a0467ce1-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                    {block.title && <h3 data-api-unique-id='productdetailview-skeleton-with-logic-r339c2a90765eff6a-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`product.detailContentJson-${index}-title`} data-api-map-var-name='block'>{block.title}</h3>}
                    {block.type === 'image' && block.content ? <img src={block.content} alt={block.title || ''} data-api-unique-id='productdetailview-skeleton-with-logic-rc7f5a103597365a7-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' /> : <p data-api-unique-id='productdetailview-skeleton-with-logic-r69c9720a0baa12c6-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`product.detailContentJson-${index}-content`} data-api-map-var-name='block'>{block.content}</p>}
                  </div>)}
              </div> : <p data-api-unique-id='productdetailview-skeleton-with-logic-rdc5c2562cc6045cc-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>暂无详细图文介绍</p>}
          </div>

          <Separator data-api-unique-id='productdetailview-skeleton-with-logic-r09a0ee176c96f70d-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' />

          {/* 规格参数 */}
          <div id="section-specs" data-api-unique-id='productdetailview-skeleton-with-logic-r59615fa395fe32a0-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            <h2 data-api-unique-id='productdetailview-skeleton-with-logic-rfe406401e6e4aaa8-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>规格参数</h2>
            {product.parameterJson && product.parameterJson.length > 0 ? <div data-api-unique-id='productdetailview-skeleton-with-logic-raeea875454c23560-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                {product.parameterJson.map((group, index) => <div key={index} data-api-unique-id='productdetailview-skeleton-with-logic-r1db1e1026c4cb93e-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                    <h3 data-api-unique-id='productdetailview-skeleton-with-logic-rf05a796bd0ffb46a-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>{group.group || '通用参数'}</h3>
                    <table border={1} data-api-unique-id='productdetailview-skeleton-with-logic-rf5647ce4b9b75447-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                      <tbody data-api-unique-id='productdetailview-skeleton-with-logic-rcc6bd85b1f397514-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                        {group.items?.map((item, index1) => <tr key={index1} data-api-unique-id='productdetailview-skeleton-with-logic-rf400ec49d1f1c770-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                            <td data-api-unique-id='productdetailview-skeleton-with-logic-r34ec77f0203af6f2-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`product.parameterJson-${index}-group.items-${index1}-key`} data-api-map-var-name='item'>{item.key}</td>
                            <td data-api-unique-id='productdetailview-skeleton-with-logic-r2e0808935ea921fa-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`product.parameterJson-${index}-group.items-${index1}-value`} data-api-map-var-name='item'>{item.value}</td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>)}
              </div> : <p data-api-unique-id='productdetailview-skeleton-with-logic-rc8e0cdc5afce7795-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>暂无规格参数数据</p>}
          </div>

          <Separator data-api-unique-id='productdetailview-skeleton-with-logic-r8c272bbd63c4c7b9-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' />

          {/* 物流与贸易 */}
          <div id="section-trade" data-api-unique-id='productdetailview-skeleton-with-logic-r52de59f3a93b6b92-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            <h2 data-api-unique-id='productdetailview-skeleton-with-logic-r361659fe2050da3a-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>物流与贸易说明</h2>
            {product.tradeInfoJson ? <div data-api-unique-id='productdetailview-skeleton-with-logic-rcf0fea2a075ee467-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                <Card data-api-unique-id='productdetailview-skeleton-with-logic-r36d3ac0cab8eee4c-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                  <CardHeader data-api-unique-id='productdetailview-skeleton-with-logic-r1696237634140dd5-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'><CardTitle data-api-unique-id='productdetailview-skeleton-with-logic-r89b3376f26a3d237-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>支持地区</CardTitle></CardHeader>
                  <CardContent data-api-unique-id='productdetailview-skeleton-with-logic-rf73e959b547c2617-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                    {product.tradeInfoJson.supportedRegions?.join(', ') || '全球'}
                  </CardContent>
                </Card>
                <Card data-api-unique-id='productdetailview-skeleton-with-logic-re4f105723f1d7abc-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                  <CardHeader data-api-unique-id='productdetailview-skeleton-with-logic-rd79a627de837cef7-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'><CardTitle data-api-unique-id='productdetailview-skeleton-with-logic-r68305d72ba5ab361-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>运输说明</CardTitle></CardHeader>
                  <CardContent data-api-unique-id='productdetailview-skeleton-with-logic-r7fe8e0c0e16de023-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>{product.tradeInfoJson.shippingNote || '暂无说明'}</CardContent>
                </Card>
                <Card data-api-unique-id='productdetailview-skeleton-with-logic-rd17d6782e7f4e9aa-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                  <CardHeader data-api-unique-id='productdetailview-skeleton-with-logic-r025c9b328b085e4d-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'><CardTitle data-api-unique-id='productdetailview-skeleton-with-logic-rc0ec09923dfd2f9f-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>注意事项</CardTitle></CardHeader>
                  <CardContent data-api-unique-id='productdetailview-skeleton-with-logic-r1a601e6c1b6de45d-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>{product.tradeInfoJson.tradeNotice || '暂无注意事项'}</CardContent>
                </Card>
              </div> : <p data-api-unique-id='productdetailview-skeleton-with-logic-rff221f59d0b6cba7-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>暂无物流与贸易数据</p>}
          </div>

          <Separator data-api-unique-id='productdetailview-skeleton-with-logic-r18240003b65b8c39-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' />

          {/* 评价与问答 */}
          <div id="section-faq" data-api-unique-id='productdetailview-skeleton-with-logic-rd5960a719245f577-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            <h2 data-api-unique-id='productdetailview-skeleton-with-logic-rad2f0d8eda66ce46-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>常见问题与解答</h2>
            {product.faqJson && product.faqJson.length > 0 ? <Accordion type="single" collapsible data-api-unique-id='productdetailview-skeleton-with-logic-re25a880a814b9e53-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
                {product.faqJson.map((faq, index) => <AccordionItem value={`item-${index}`} key={index} data-api-unique-id='productdetailview-skeleton-with-logic-rf7e6dcd36691ffa4-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                    <AccordionTrigger data-api-unique-id='productdetailview-skeleton-with-logic-ra37586ab1180e45f-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`product.faqJson-${index}-question`} data-api-map-var-name='faq'>{faq.question}</AccordionTrigger>
                    <AccordionContent data-api-unique-id='productdetailview-skeleton-with-logic-r5a3f6a7a86df2ce5-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`product.faqJson-${index}-answer`} data-api-map-var-name='faq'>{faq.answer}</AccordionContent>
                  </AccordionItem>)}
              </Accordion> : <p data-api-unique-id='productdetailview-skeleton-with-logic-r2e1ee9e3aaec5723-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>暂无常见问题</p>}
          </div>
        </div>
      </section>

      {/* 模块三：确定性关联推荐 */}
      <section data-api-unique-id='productdetailview-skeleton-with-logic-r6fb0c78c94f8ab2d-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
        <h2 data-api-unique-id='productdetailview-skeleton-with-logic-rc98c6410b9f62d5f-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>相关推荐</h2>
        {relatedProducts.length > 0 ? <div data-api-unique-id='productdetailview-skeleton-with-logic-rabf220a5b617109c-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>
            {relatedProducts.map((item, index) => <Card key={item.id} onClick={() => handleRelatedClick(item.id)} data-api-unique-id='productdetailview-skeleton-with-logic-r003ac6b1ae26ac6f-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                <img src={item.mainImageUrl} alt={item.name} data-api-unique-id='productdetailview-skeleton-with-logic-r5d7e5d56574c662a-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' />
                <CardHeader data-api-unique-id='productdetailview-skeleton-with-logic-r0c59c51cff4f0cab-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>
                  <CardTitle data-api-unique-id='productdetailview-skeleton-with-logic-rd6d16c60f9c5a592-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`relatedProducts-${index}-name`} data-api-map-var-name='item'>{item.name}</CardTitle>
                  <CardDescription data-api-unique-id='productdetailview-skeleton-with-logic-r99e8eb673df5baee-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic' data-api-in-loop='1'>最低约: {item.minPrice.toFixed(2)}</CardDescription>
                </CardHeader>
              </Card>)}
          </div> : <p data-api-unique-id='productdetailview-skeleton-with-logic-r532f060ed9a01a05-s420802785' data-api-unique-page-name='src/frontend/components/ProductDetailView_skeleton_with_logic'>暂无相关推荐商品</p>}
      </section>
    </article>;
}