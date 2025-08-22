/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { sale_price, quantity, discount } = purchase;
    
    if (!discount || discount === 0) {
        return sale_price * quantity;
    }
    
    const discountMultiplier = 1 - (discount / 100);
    return sale_price * quantity * discountMultiplier;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number} */

function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

function calculateRevenue(purchase, _product) {
    return calculateSimpleRevenue(purchase, _product);
}

function calculateBonus(index, total, seller) {
    return calculateBonusByProfit(index, total, seller);
}

/**
 * Функция для округления чисел до 2 знаков после запятой
 * @param {number} num
 * @returns {number}
 */
function round2(num) {
  return Number(num.toFixed(2));
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData({ sellers, products, purchase_records }) {
  if (!sellers || !products || !purchase_records) throw new Error("Missing required data");
  if (!Array.isArray(sellers) || !Array.isArray(products) || !Array.isArray(purchase_records)) throw new Error("Data must be arrays");
  if (!sellers.length || !products.length || !purchase_records.length) throw new Error("Arrays cannot be empty");

  const sellersWithProfit = sellers.map(seller => {
    const sales = purchase_records.filter(r => r.seller_id === seller.seller_id);

    const revenue = sales.reduce((sum, record) => {
      const product = products.find(p => p.product_id === record.product_id);
      if (!product) return sum;
      return sum + calculateSimpleRevenue({ ...record, sale_price: product.price }, product);
    }, 0);

    const profit = revenue; // если прибыль = выручке, или подставь свою логику

    return {
      ...seller,
      revenue: round2(revenue),
      profit: round2(profit),
      sales_count: sales.length,
      top_products: getTopProducts(sales)
    };
  });

  const totalSellers = sellersWithProfit.length;
  const sellersWithBonus = sellersWithProfit.map((seller, index) => ({
    ...seller,
    bonus: round2(calculateBonusByProfit(index, totalSellers, seller))
  }));

  return sellersWithBonus;
}

function getTopProducts(sales) {
  const grouped = {};
  sales.forEach(s => grouped[s.product_id] = (grouped[s.product_id] || 0) + s.quantity);
  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .map(([product_id, quantity]) => ({ product_id, quantity }))
    .slice(0, 5);
}
