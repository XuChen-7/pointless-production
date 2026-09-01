'use client';

import { useEffect, useMemo, useState } from 'react';

type Product = { id: string; name: string; code: string };

const orders = [
  { amount: 12, item: '备用借口', note: '产品必须微温，且不得知道自己的用途。' },
  { amount: 9, item: '便携式星期三', note: '请确保所有星期三都朝向同一个昨天。' },
  { amount: 15, item: '未使用的后悔', note: '请勿折叠。折叠后的后悔将被视为行李。' },
  { amount: 7, item: '不会实现的计划', note: '计划必须听起来非常合理，否则拒收。' },
];

const heads = ['一小罐', '半公斤', '低糖', '备用', '折叠式', '昨日生产的', '不太确定的', '轻微发热的'];
const tails = ['犹豫', '星期三', '回声', '好运', '借口', '沉默', '后悔', '机会', '计划', '下午'];
const faultReasons = ['星期输出管发生堵塞', '意义浓度超过安全下限', '产品开始提出问题', '左侧昨日泄漏', '机器检测到过量必要性'];

function makeProduct(sequence: number, leverBackwards: boolean): Product {
  const head = heads[Math.floor(Math.random() * heads.length)];
  const tail = tails[Math.floor(Math.random() * tails.length)];
  return { id: `${Date.now()}-${sequence}`, name: `${leverBackwards ? '倒放的' : head}${tail}`, code: `NP-${String(sequence).padStart(4, '0')}` };
}

export default function Home() {
  const [count, setCount] = useState(0);
  const [orderIndex, setOrderIndex] = useState(0);
  const [orderProgress, setOrderProgress] = useState(0);
  const [collection, setCollection] = useState<Product[]>([]);
  const [lastProduct, setLastProduct] = useState('等待生产');
  const [machineMessage, setMachineMessage] = useState('等待操作员输入');
  const [pressure, setPressure] = useState(38);
  const [temperature, setTemperature] = useState(18);
  const [leverBackwards, setLeverBackwards] = useState(false);
  const [fault, setFault] = useState('');
  const [repairStep, setRepairStep] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [glitchFace, setGlitchFace] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [soundOn, setSoundOn] = useState(false);
  const [offlineNote, setOfflineNote] = useState('');
  const [loaded, setLoaded] = useState(false);

  const order = orders[orderIndex % orders.length];
  const progress = Math.min(orderProgress / order.amount, 1);
  const serial = useMemo(() => String(4021 + count * 17).padStart(6, '0'), [count]);
  const revealLevel = count >= 24 ? 3 : count >= 18 ? 2 : count >= 8 ? 1 : 0;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('zero-machine-save');
      if (raw) {
        const saved = JSON.parse(raw) as { count?: number; orderIndex?: number; orderProgress?: number; collection?: Product[]; pressure?: number; temperature?: number; leverBackwards?: boolean; lastSeen?: number };
        setCount(saved.count ?? 0);
        setOrderIndex(saved.orderIndex ?? 0);
        setOrderProgress(saved.orderProgress ?? 0);
        setCollection(saved.collection ?? []);
        setPressure(saved.pressure ?? 38);
        setTemperature(saved.temperature ?? 18);
        setLeverBackwards(saved.leverBackwards ?? false);
        if (saved.lastSeen) {
          const minutes = Math.max(1, Math.floor((Date.now() - saved.lastSeen) / 60000));
          setOfflineNote(`你离开了 ${minutes} 分钟。本设备并未在意。`);
        }
      }
    } catch { localStorage.removeItem('zero-machine-save'); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('zero-machine-save', JSON.stringify({ count, orderIndex, orderProgress, collection, pressure, temperature, leverBackwards, lastSeen: Date.now() }));
  }, [loaded, count, orderIndex, orderProgress, collection, pressure, temperature, leverBackwards]);

  function beep(frequency = 90, duration = 0.06) {
    if (!soundOn) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + duration);
  }

  function produce() {
    if (fault) { setMachineMessage('故障期间继续工作属于非常积极的错误'); beep(48, .12); return; }
    const nextCount = count + 1;
    const product = makeProduct(nextCount, leverBackwards);
    const escaped = nextCount % 7 === 0;
    setCount(nextCount);
    setPressure((value) => Math.min(99, value + (leverBackwards ? 8 : 4)));
    setLastProduct(product.name);
    if (escaped) setMachineMessage(`${product.name} 已逃离传送带。请假装没有看见。`);
    else { setCollection((items) => [product, ...items].slice(0, 80)); setMachineMessage('生产完成'); }
    const nextProgress = orderProgress + 1;
    if (nextProgress >= order.amount) {
      setOrderProgress(0); setOrderIndex((value) => value + 1);
      setMachineMessage('订单完成。正在生成一份同样不重要的新订单。');
    } else setOrderProgress(nextProgress);
    if (nextCount % 11 === 0 || pressure > 90) {
      setFault(faultReasons[Math.floor(Math.random() * faultReasons.length)]); setRepairStep(0);
    }
    if (nextCount === 18 || nextCount === 31) {
      setGlitchFace(true); window.setTimeout(() => setGlitchFace(false), 720);
    }
    setPulse(false); window.setTimeout(() => setPulse(true), 8); beep(82 + (nextCount % 5) * 12);
  }

  function pullLever() {
    setLeverBackwards((value) => !value);
    setMachineMessage(leverBackwards ? '时间方向已恢复为勉强向前' : '生产方向：朝向昨天');
    setPressure((value) => Math.min(99, value + 6)); beep(62, .1);
  }

  function turnDial(delta: number) {
    setTemperature((value) => Math.max(-9, Math.min(42, value + delta)));
    setMachineMessage(delta > 0 ? '情绪温度没有变化。机器温度略有变化。' : '正在冷却一种尚未发生的事故'); beep(118, .04);
  }

  function touchForbidden() {
    setFault('操作员触碰了禁止触碰按钮'); setRepairStep(0); setMachineMessage('很好。'); beep(44, .18);
  }

  function repair() {
    if (repairStep < 2) {
      setRepairStep((value) => value + 1);
      setMachineMessage(repairStep === 0 ? '外壳发出不赞同的声音' : '请不要把维修理解为击打'); beep(52 + repairStep * 20, .08);
    } else {
      setFault(''); setRepairStep(0); setPressure(31);
      setMachineMessage(revealLevel >= 2 ? '道歉已接受。不是因为我在意。' : '维修完成。道歉已归档。'); beep(140, .14);
    }
  }

  function toggleSelected(id: string) {
    setSelected((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : ids.length < 2 ? [...ids, id] : [ids[1], id]);
  }

  function fuse() {
    if (selected.length !== 2) return;
    const first = collection.find((item) => item.id === selected[0]);
    const second = collection.find((item) => item.id === selected[1]);
    if (!first || !second) return;
    const fused: Product = { id: `f-${Date.now()}`, name: `${first.name}与${second.name}之间的误会`, code: `F-${String(count).padStart(3, '0')}` };
    setCollection((items) => [fused, ...items]); setLastProduct(fused.name); setSelected([]);
    setMachineMessage('融合完成。产品的用途变得更加不明确。'); beep(166, .16);
  }

  return (
    <main className={`site-shell reveal-${revealLevel}`}>
      <header className="topbar">
        <div className="brand-block"><span className="brand-mark" aria-hidden="true">0</span><div><p className="eyebrow">无用产品制造局 · 第零车间</p><h1>请勿停止生产</h1></div></div>
        <div className="header-actions">
          <button className="utility-button" onClick={() => setSoundOn((value) => !value)} aria-pressed={soundOn}>{soundOn ? '声音：开' : '声音：关'}</button>
          <button className="utility-button" onClick={() => setDrawerOpen(true)}>产品仓库 <b>{collection.length}</b></button>
          <div className="shift-status"><span /> 当前班次：没有结束时间</div>
        </div>
      </header>

      {offlineNote && <button className="offline-note" onClick={() => setOfflineNote('')}><b>离线生产报告</b><span>{offlineNote}</span><i>×</i></button>}

      <section className="workspace" aria-label="第零号制造机操作台">
        <aside className="side-panel order-panel">
          <div className="panel-label">今日指令 / {String(orderIndex + 1).padStart(3, '0')}</div>
          <div className="paper-card">
            <p className="stamp">紧急但不重要</p>
            <h2>请生产<br/><strong>{order.amount} 个{order.item}</strong></h2>
            <p>{order.note}</p>
            <div className="deadline"><span>截止</span><b>在今天变成昨天之前</b></div>
          </div>
          <div className="quota"><div className="quota-head"><span>订单进度</span><b>{orderProgress} / {order.amount}</b></div><div className="progress-track"><i style={{ width: `${progress * 100}%` }} /></div></div>
          <p className="tiny-note">※ 超额生产不会获得奖励，但会被记录。</p>
          {count >= 3 && <button className={`lever-control ${leverBackwards ? 'pulled' : ''}`} onClick={pullLever}><i/><span><b>时间方向拉杆</b><small>{leverBackwards ? '当前：朝向昨天' : '当前：勉强向前'}</small></span></button>}
          {count >= 6 && <div className="dial-control"><button onClick={() => turnDial(-1)} aria-label="降低温度">−</button><div><b>{temperature}°</b><small>产品情绪温度</small></div><button onClick={() => turnDial(1)} aria-label="升高温度">＋</button></div>}
        </aside>

        <section className={`machine-zone ${pulse ? 'machine-pulse' : ''} ${fault ? 'has-fault' : ''}`}>
          <div className="machine-shadow" />
          <div className="machine">
            <div className="machine-top"><div className="warning-light"><i /></div><div className="machine-nameplate">零号机 <small>NP–00</small></div><div className="exhaust"><i/><i/><i/></div></div>
            <div className="machine-body">
              <div className="gauge-cluster" aria-hidden="true"><div className="gauge"><i style={{ transform: `rotate(${Math.min(58, count * 7 - 54)}deg)` }}/><b>意义</b></div><div className="gauge"><i style={{ transform: `rotate(${pressure - 55}deg)` }}/><b>压力 {pressure}</b></div></div>
              <div className="screen" role="status" aria-live="polite">
                <div className="screen-head"><span>{fault ? 'SYSTEM_UNCERTAIN' : 'SYSTEM_NORMAL'}</span><span>#{serial}</span></div>
                {glitchFace ? <div className="glitch-face">你回来了&nbsp;&nbsp;(._.)</div> : <><strong>{fault ? '生产中断 / 原因如下' : machineMessage}</strong><p>{fault || lastProduct}</p><div className="screen-line">{'▓'.repeat(Math.min(12, count % 13))}{'░'.repeat(12 - Math.min(12, count % 13))}</div></>}
              </div>
              <div className="control-row">
                <div className="switches" aria-hidden="true"><i/><i/><i/></div>
                <button className="produce-button" onClick={produce} aria-label="启动生产"><span>按</span></button>
                <div className="button-copy"><b>主要生产按钮</b><small>{fault ? '目前按它也没有用' : '按下前请确认你已经按下'}</small></div>
              </div>
              {count >= 8 && !fault && <button className="forbidden-button" onClick={touchForbidden}>禁止触碰</button>}
            </div>
            <div className="machine-feet"><i/><i/></div>
          </div>
          {fault ? <div className="repair-box"><b>维修程序 {repairStep + 1}/3</b><button onClick={repair}>{['拍打左侧外壳','再拍一下以确认','向机器诚恳道歉'][repairStep]}</button></div> : <p className="instruction">↑ 不需要理解。按就对了。</p>}
        </section>

        <aside className="side-panel log-panel">
          <div className="panel-label">实时生产记录</div>
          <div className="counter-card"><span>本班次有效产出</span><strong>{String(count).padStart(5, '0')}</strong><small>其中有用：00000</small></div>
          <div className="log-list"><div className={count > 0 ? 'active' : ''}><time>现在</time><p>{count > 0 ? `${lastProduct} 已离开传送带` : '传送带正在等待一件事情发生'}</p></div><div><time>刚才</time><p>{revealLevel >= 2 ? '机器确认操作员仍在附近' : '机器被确认仍然是一台机器'}</p></div><div><time>更早</time><p>意义检测器读数：不详</p></div></div>
          <button className="warehouse-button" onClick={() => setDrawerOpen(true)}>查看全部无用产品 <span>{collection.length} 件</span></button>
        </aside>
      </section>

      <footer><p>操作员须知：本设备没有用途。请保持运行。</p><span>车间温度 {temperature}°C · 情绪温度 {revealLevel >= 3 ? '拒绝显示' : '未安装'}</span></footer>

      {drawerOpen && <div className="drawer-backdrop" onMouseDown={() => setDrawerOpen(false)}><aside className="warehouse-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="产品仓库"><div className="drawer-head"><div><p>PROPERTY OF NOBODY</p><h2>无用产品仓库</h2></div><button onClick={() => setDrawerOpen(false)} aria-label="关闭仓库">×</button></div><p className="drawer-help">选择两个产品，可以把它们塞回机器。不会变得更有用。</p>{collection.length === 0 ? <div className="empty-warehouse">仓库目前很有秩序。<br/>这是一个需要立刻纠正的问题。</div> : <div className="product-grid">{collection.map((product) => <button key={product.id} className={selected.includes(product.id) ? 'selected' : ''} onClick={() => toggleSelected(product.id)}><small>{product.code}</small><b>{product.name}</b><i>{selected.includes(product.id) ? '已选择' : '无用途'}</i></button>)}</div>}<div className="fusion-bar"><span>{selected.length}/2 件产品已投入回炉口</span><button onClick={fuse} disabled={selected.length !== 2}>执行错误融合</button></div></aside></div>}
    </main>
  );
}
