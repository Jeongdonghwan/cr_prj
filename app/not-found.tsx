import Link from 'next/link';
import { Actions } from '../components/Common';

export default function NotFound() {
  return (
    <main>
      <div className="wrap content page-top">
        <h1 className="page-title">페이지를 찾을 수 없습니다</h1>
        <p className="prose-p">주소가 바뀌었거나 아직 열리지 않은 페이지입니다. <Link href="/area/">지역 목록</Link>에서 찾아보시거나 바로 전화 주세요.</p>
        <Actions />
      </div>
    </main>
  );
}
