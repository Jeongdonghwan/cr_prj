"""오늘 열어야 할 묶음(OPEN_WAVE)과 오늘 발행할 글 수를 날짜로 계산한다. 상태를 저장하지 않으므로 같은 날 두 번 돌려도 같다.

  python -I drip_status.py data/drip.json [YYYY-MM-DD]
  → 마지막 줄: WAVE=<n> POST=<오늘 글 수> URL=<사이트 주소>

data/drip.json 예:
  {"siteUrl": "https://도메인", "launch": "2026-10-28", "everyDays": 2, "maxWave": 4,
   "postDays": 30, "postsPerDay": 1.5, "hold": null}
- launch(오픈일) = 1번 묶음. everyDays 마다 다음 묶음. 마지막 묶음은 오픈 7일 안이어야 한다(넘으면 오류).
- postsPerDay 1.5 = 하루 1편·2편 번갈아 (30일 45편). 1 또는 2도 된다.
- hold: "YYYY-MM-DD" — 그 날짜 기준 묶음에서 오픈만 멈춘다(수집이 0일 때). 글은 계속.
"""
import datetime as dt, json, math, sys


def status(cfg, today):
    launch = dt.date.fromisoformat(cfg['launch'])
    if (cfg['maxWave'] - 1) * cfg['everyDays'] > 7:
        raise SystemExit('마지막 묶음이 오픈 7일을 넘음 — everyDays 나 maxWave 를 줄인다')
    cap = dt.date.fromisoformat(cfg['hold']) if cfg.get('hold') else today
    d = (min(today, cap) - launch).days
    wave = 0 if d < 0 else min(cfg['maxWave'], 1 + d // cfg['everyDays'])
    p, k = cfg.get('postsPerDay', 1), (today - launch).days
    post = math.floor((k + 1) * p) - math.floor(k * p) if 0 <= k < cfg.get('postDays', 30) else 0
    return wave, post


def demo():
    c = {'launch': '2026-10-28', 'everyDays': 2, 'maxWave': 4, 'postDays': 30, 'postsPerDay': 1.5}
    t = dt.date.fromisoformat
    assert status(c, t('2026-10-28')) == (1, 1)
    assert status(c, t('2026-10-29')) == (1, 2)
    assert status(c, t('2026-10-30'))[0] == 2
    assert status(c, t('2026-11-03'))[0] == 4                     # 오픈 6일째 전부
    assert status(c, t('2026-11-27')) == (4, 0)                   # 30일 뒤 발행 끝
    assert sum(status(c, t('2026-10-28') + dt.timedelta(i))[1] for i in range(30)) == 45
    assert status({**c, 'hold': '2026-10-31'}, t('2026-11-05'))[0] == 2
    print('demo ok')


if __name__ == '__main__':
    if len(sys.argv) < 2: demo(); sys.exit()
    cfg = json.load(open(sys.argv[1], encoding='utf-8'))
    today = dt.date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 else (dt.datetime.utcnow() + dt.timedelta(hours=9)).date()  # KST
    w, p = status(cfg, today)
    print(f'WAVE={w} POST={p} URL={cfg["siteUrl"]}')
