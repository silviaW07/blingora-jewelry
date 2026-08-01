'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCategory } from '@/frontend/route-params';
import type { CartItemData, CartSummary, RecommendedProductData, CartItemStatus } from '@/frontend/actions/Cart';
import { getCartData, updateCartItemQuantity, removeCartItem, clearCart, removeInvalidCartItems, getRecommendedProducts } from '@/frontend/actions/Cart';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// ===== 枚举映射 =====
const CART_ITEM_STATUS_LABELS: Record<CartItemStatus, string> = {
  VALID: '有效',
  INVALID: '失效'
};

// ===== 局部受控输入组件 (场景 A: 有副作用) =====
interface QuantityControlProps {
  initialValue: number;
  max: number;
  disabled: boolean;
  onUpdate: (val: number) => void;
}
function QuantityControl({
  initialValue,
  max,
  disabled,
  onUpdate
}: QuantityControlProps) {
  const [val, setVal] = useState<string>(initialValue.toString());
  const isComposingRef = useRef(false);
  useEffect(() => {
    setVal(initialValue.toString());
  }, [initialValue]);
  const commitValue = useCallback((targetValue: string) => {
    const num = parseInt(targetValue, 10);
    if (isNaN(num) || num < 0) {
      setVal(initialValue.toString());
      return;
    }
    if (num > max) {
      toast.error(`超出库存限制，当前最大可用 ${max}`);
      setVal(max.toString());
      onUpdate(max);
      return;
    }
    if (num !== initialValue) {
      onUpdate(num);
    }
  }, [initialValue, max, onUpdate]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVal(e.target.value);
    // 纯输入 onChange 不立刻触发 API 更新，交由 blur/enter 或按钮触发
  };
  const handleBlur = () => {
    commitValue(val);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isComposingRef.current) return;
      commitValue(val);
    }
  };
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
  };
  const handleMinus = () => {
    const currentNum = parseInt(val, 10) || 1;
    if (currentNum > 1) {
      const newVal = currentNum - 1;
      setVal(newVal.toString());
      onUpdate(newVal);
    } else if (currentNum === 1) {
      // 减至 0，执行删除语义
      onUpdate(0);
    }
  };
  const handlePlus = () => {
    const currentNum = parseInt(val, 10) || 0;
    if (currentNum < max) {
      const newVal = currentNum + 1;
      setVal(newVal.toString());
      onUpdate(newVal);
    } else {
      toast.error(`库存不足，最多添加 ${max} 个`);
    }
  };
  return <fieldset disabled={disabled} data-api-unique-id='cartview-skeleton-with-logic-r40a1975bc6d63d21-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
      <Button variant="outline" size="icon" onClick={handleMinus} data-api-unique-id='cartview-skeleton-with-logic-r686aa4309684d134-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
        -
      </Button>
      <Input type="text" value={val} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} data-api-unique-id='cartview-skeleton-with-logic-r58fed9eb8ab65997-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' />
      <Button variant="outline" size="icon" onClick={handlePlus} data-api-unique-id='cartview-skeleton-with-logic-rf2c0b6f6f879e56d-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
        +
      </Button>
    </fieldset>;
}

// ===== 主页面组件 =====
export default function CartPage() {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItemData[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [recommended, setRecommended] = useState<RecommendedProductData[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // 核心数据加载
  const loadCartData = useCallback(async () => {
    try {
      const data = await getCartData();
      setItems(data.items);
      setSummary(data.summary);
    } catch (e) {
      // 全局拦截已经处理了 error 抛出，这里无需额外 UI 阻断
    }
  }, []);
  const loadRecommended = useCallback(async () => {
    try {
      const {
        list
      } = await getRecommendedProducts();
      setRecommended(list);
    } catch (e) {}
  }, []);
  useEffect(() => {
    Promise.all([loadCartData(), loadRecommended()]).finally(() => {
      setLoading(false);
    });
  }, [loadCartData, loadRecommended]);

  // 操作 Handlers
  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await updateCartItemQuantity({
        cartItemId,
        quantity: newQuantity
      });
      await loadCartData();
    } finally {
      setActionLoading(false);
    }
  };
  const handleRemoveItem = async (cartItemId: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await removeCartItem({
        cartItemId
      });
      await loadCartData();
    } finally {
      setActionLoading(false);
    }
  };
  const handleRemoveInvalid = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await removeInvalidCartItems();
      toast.success('失效商品清理完成');
      await loadCartData();
    } finally {
      setActionLoading(false);
    }
  };
  const handleClearCart = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await clearCart();
      toast.success('购物车已清空');
      await loadCartData();
      setIsClearConfirmOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // 派生状态
  const hasInvalidItems = items.some(item => item.status === 'INVALID');
  const isEmpty = items.length === 0;
  return <main data-api-unique-id='cartview-skeleton-with-logic-r56e0173fd3ec4fab-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
      <header data-api-unique-id='cartview-skeleton-with-logic-rbe913c82c7a877e8-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
        <h1 data-api-unique-id='cartview-skeleton-with-logic-r7fb6bdf28c2f5394-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Secure Checkout</h1>
        <p data-api-unique-id='cartview-skeleton-with-logic-r063dc5faf1d066db-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Review your items and proceed to seamless payment.</p>
      </header>

      <section data-api-unique-id='cartview-skeleton-with-logic-r433d97f7ac90333b-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
        {loading ? <div data-api-unique-id='cartview-skeleton-with-logic-rf8e341b9ec1669cb-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
            <p data-api-unique-id='cartview-skeleton-with-logic-r4f031f6f14be5b1f-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>正在加载购物车数据，请稍候...</p>
          </div> : isEmpty ? <div data-api-unique-id='cartview-skeleton-with-logic-rb56693044adc3f07-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
            <p data-api-unique-id='cartview-skeleton-with-logic-rd64ac901387e6cec-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>您的购物车空空如也，去挑选喜欢的商品吧</p>
            <Button onClick={() => ProductCategory.navigateToDefault(router)} data-api-unique-id='cartview-skeleton-with-logic-r628ac31a2bcac861-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
              Continue Shopping
            </Button>
          </div> : <div data-api-unique-id='cartview-skeleton-with-logic-r33a66a9c5d29320f-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
            {/* 购物车商品列表 */}
            <div data-api-unique-id='cartview-skeleton-with-logic-r4982b5f197d0a645-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
              <header data-api-unique-id='cartview-skeleton-with-logic-rd4562a7ee07457ff-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
                <h2 data-api-unique-id='cartview-skeleton-with-logic-race6938b862fa606-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Shopping Cart</h2>
                {hasInvalidItems && <Button variant="secondary" onClick={handleRemoveInvalid} disabled={actionLoading} data-api-unique-id='cartview-skeleton-with-logic-r24c4c97cdb87df10-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
                    Clear Invalid Items
                  </Button>}
                <Button variant="destructive" onClick={() => setIsClearConfirmOpen(true)} disabled={actionLoading} data-api-unique-id='cartview-skeleton-with-logic-r6d915af3b097d30c-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
                  Clear All
                </Button>
              </header>

              <div data-api-unique-id='cartview-skeleton-with-logic-rde07e733ba371dba-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
                {items.map((item, index) => <Card key={item.cartItemId} data-api-unique-id='cartview-skeleton-with-logic-ra0da645c520daf45-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                    <CardHeader data-api-unique-id='cartview-skeleton-with-logic-r3133cdd7c9f9ced5-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                      <img src={item.mainImageUrl} alt={item.productName} data-api-unique-id='cartview-skeleton-with-logic-rd6a95f709975579d-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' />
                      <CardTitle data-api-unique-id='cartview-skeleton-with-logic-rb4eb74618de318d2-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`items-${index}-productName`} data-api-map-var-name='item'>{item.productName}</CardTitle>
                      {item.status === 'INVALID' && <Badge variant="destructive" data-api-unique-id='cartview-skeleton-with-logic-rffac13e812305d27-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`items-${index}-invalidReason`} data-api-map-var-name='item'>
                          {CART_ITEM_STATUS_LABELS[item.status]} - {item.invalidReason}
                        </Badge>}
                    </CardHeader>
                    <CardContent data-api-unique-id='cartview-skeleton-with-logic-r8d8818323505150a-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                      <dl data-api-unique-id='cartview-skeleton-with-logic-r5e6a68019382713e-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                        {item.skuAttributes?.map((attr, index1) => <div key={index1} data-api-unique-id='cartview-skeleton-with-logic-r5f29cdceff9cd1f9-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                            <dt data-api-unique-id='cartview-skeleton-with-logic-r38f48e92e69a9a02-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`items-${index}-item.skuAttributes-${index1}-name`} data-api-map-var-name='attr'>{attr.name}</dt>
                            <dd data-api-unique-id='cartview-skeleton-with-logic-r7d5e05d08ad16893-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`items-${index}-item.skuAttributes-${index1}-value`} data-api-map-var-name='attr'>{attr.value}</dd>
                          </div>)}
                      </dl>
                      <p data-api-unique-id='cartview-skeleton-with-logic-rd93e923443a61487-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`items-${index}-price`} data-api-map-var-name='item'>单价: {item.price}</p>
                      <p data-api-unique-id='cartview-skeleton-with-logic-raffd3c9f8d5d2744-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`items-${index}-subtotal`} data-api-map-var-name='item'>小计: {item.subtotal}</p>
                      
                      <QuantityControl initialValue={item.quantity} max={item.stock} disabled={actionLoading || item.status === 'INVALID'} onUpdate={val => handleUpdateQuantity(item.cartItemId, val)} data-api-unique-id='cartview-skeleton-with-logic-r1937e945cb9d0f7d-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' />
                    </CardContent>
                    <CardFooter data-api-unique-id='cartview-skeleton-with-logic-r01bc3d90867ab373-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                      <Button variant="outline" onClick={() => handleRemoveItem(item.cartItemId)} disabled={actionLoading} data-api-unique-id='cartview-skeleton-with-logic-r1b3cad8ce9b13d6b-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                        Remove
                      </Button>
                    </CardFooter>
                  </Card>)}
              </div>
            </div>

            {/* 价格汇总区 */}
            {summary && <Card data-api-unique-id='cartview-skeleton-with-logic-r464467c142d5b6b5-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
                <CardHeader data-api-unique-id='cartview-skeleton-with-logic-r00f757fe67b5f350-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
                  <CardTitle data-api-unique-id='cartview-skeleton-with-logic-re8629a7a2eacdc24-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Order Summary</CardTitle>
                </CardHeader>
                <CardContent data-api-unique-id='cartview-skeleton-with-logic-r6c8dcbd757e44074-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
                  <p data-api-unique-id='cartview-skeleton-with-logic-rff3661675192019f-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Total Items Price: {summary.totalPrice}</p>
                  <p data-api-unique-id='cartview-skeleton-with-logic-ra4f98036e9c06c6e-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Estimated Shipping: {summary.shippingFee}</p>
                  <p data-api-unique-id='cartview-skeleton-with-logic-r182ffe5ff8419f13-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Discount: {summary.discount}</p>
                  <p data-api-unique-id='cartview-skeleton-with-logic-r3fcf3b2c237029dc-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'><strong data-api-unique-id='cartview-skeleton-with-logic-r65ff709730b37aaf-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Final Amount: {summary.finalAmount}</strong></p>
                  <p data-api-unique-id='cartview-skeleton-with-logic-r6c09068100ae2792-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'><small data-api-unique-id='cartview-skeleton-with-logic-rf69622658104a9fd-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Taxes and additional fees may apply during checkout.</small></p>
                </CardContent>
                <CardFooter data-api-unique-id='cartview-skeleton-with-logic-r19f720395f439f94-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
                  <Button disabled={actionLoading || isEmpty} data-api-unique-id='cartview-skeleton-with-logic-r817bd8606969951f-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Proceed to Checkout</Button>
                  <Button variant="link" onClick={() => ProductCategory.navigateToDefault(router)} data-api-unique-id='cartview-skeleton-with-logic-r72689cafa7299ebe-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
                    Continue Shopping
                  </Button>
                </CardFooter>
              </Card>}
          </div>}
      </section>

      {/* 购物辅助推荐区 */}
      <section data-api-unique-id='cartview-skeleton-with-logic-r53a1ad56cee18239-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
        <header data-api-unique-id='cartview-skeleton-with-logic-r82c31478aedead4b-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
          <h2 data-api-unique-id='cartview-skeleton-with-logic-r39fbcc80b6108b4b-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>Continue Your Journey</h2>
        </header>
        <div data-api-unique-id='cartview-skeleton-with-logic-rf12cfbda461cf54c-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
          {recommended.length > 0 ? recommended.map((prod, index) => <Card key={prod.productId} data-api-unique-id='cartview-skeleton-with-logic-ra0620c79f23f46ac-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                <CardHeader data-api-unique-id='cartview-skeleton-with-logic-r0caf66aaf0999cdc-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                  <img src={prod.mainImageUrl} alt={prod.name} data-api-unique-id='cartview-skeleton-with-logic-r44f2617b2a07c010-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' />
                  <CardTitle data-api-unique-id='cartview-skeleton-with-logic-r587837c79a7f0a9a-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`recommended-${index}-name`} data-api-map-var-name='prod'>{prod.name}</CardTitle>
                </CardHeader>
                <CardContent data-api-unique-id='cartview-skeleton-with-logic-r24b4a8466a16fc49-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1'>
                  <p data-api-unique-id='cartview-skeleton-with-logic-r614c21897b74fe9c-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`recommended-${index}-priceMin`} data-api-map-var-name='prod'>Starts at {prod.priceMin}</p>
                  <p data-api-unique-id='cartview-skeleton-with-logic-ra4fbced3a8cca941-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic' data-api-in-loop='1' data-api-bind-info={`recommended-${index}-ratingAverage`} data-api-map-var-name='prod'>Rating: {prod.ratingAverage} / 5</p>
                </CardContent>
              </Card>) : <p data-api-unique-id='cartview-skeleton-with-logic-r644f2e4b7a7025b1-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>当前暂无推荐商品</p>}
        </div>
      </section>

      {/* 清空确认弹窗 */}
      <Dialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen} data-api-unique-id='cartview-skeleton-with-logic-r2cef2ffbd97e2e6f-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
        <DialogContent data-api-unique-id='cartview-skeleton-with-logic-r1c7d21fd911e7831-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
          <DialogHeader data-api-unique-id='cartview-skeleton-with-logic-ra2dfef977b9319a0-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
            <DialogTitle data-api-unique-id='cartview-skeleton-with-logic-r9f938d9d952b3606-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>清空购物车</DialogTitle>
            <DialogDescription data-api-unique-id='cartview-skeleton-with-logic-r5f496ae945673c89-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
              此操作将移除购物车内的所有商品，确认要清空吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter data-api-unique-id='cartview-skeleton-with-logic-rff7d8e29051b685c-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
            <Button variant="outline" onClick={() => setIsClearConfirmOpen(false)} disabled={actionLoading} data-api-unique-id='cartview-skeleton-with-logic-r66b7aa0eb9a5550c-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
              取消
            </Button>
            <Button variant="destructive" onClick={handleClearCart} disabled={actionLoading} data-api-unique-id='cartview-skeleton-with-logic-rb452120b2e4d6d62-s1911138063' data-api-unique-page-name='src/frontend/components/CartView_skeleton_with_logic'>
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>;
}