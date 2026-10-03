import type { Course } from './App';

export default function Price({ course }: { course: Course }) {
  const [, symbol, amount] = course.price.match(/^(¥)?(.*)$/) ?? [];
  return <div className="price"><span className="price-num">{symbol && <small>{symbol}</small>}{amount}</span>{(course.priceTag || course.priceNote) && <div>{course.priceTag && <span className="early-pill">{course.priceTag}</span>}{course.priceNote && <p>{course.priceNote}</p>}</div>}</div>;
}
