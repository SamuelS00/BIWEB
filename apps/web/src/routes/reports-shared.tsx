import { Link } from '@tanstack/react-router';
import { Avatar, Badge, Icon } from '@biweb/ui';
import { coverUrl, statusTone, type Report } from '../fixtures/lume-varejo';
import { useUi } from '../state/ui-store';

export function FavButton({ id, name }: { id: string; name: string }) {
  const fav = useUi((s) => s.favorites.includes(id)), toggle = useUi((s) => s.toggleFavorite);
  return (
    <button type="button" className="rp-fav" aria-pressed={fav} aria-label={fav ? `Remover ${name} dos favoritos` : `Favoritar ${name}`} title={fav ? 'Remover dos favoritos' : 'Favoritar'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }}>
      <Icon name="star" size={16} />
    </button>
  );
}

export function StatusBadges({ r }: { r: Report }) {
  return (
    <span className="bw-row" style={{ gap: 4 }}>
      <Badge tone={statusTone[r.status]}>{r.status}{r.version ? ` ${r.version}` : ''}</Badge>
      {r.certified && <Badge tone="success" icon="check">Certificado</Badge>}
      {r.origin === 'copilot' && <Badge tone="accent" icon="copilot">Criado com Copilot</Badge>}
    </span>
  );
}

/** Card de relatório com capa. O card inteiro é o link; favoritar fica por cima. */
export function ReportCard({ r, i, compact }: { r: Report; i: number; compact?: boolean }) {
  return (
    <article className={`rp-card bw-lift${r.status === 'Depreciado' ? ' rp-card--dep' : ''}${compact ? ' rp-card--compact' : ''}`} style={{ ['--i' as string]: i }}>
      <Link to="/reports/$reportId" params={{ reportId: r.id }} className="rp-card-link" aria-label={`${r.name} · ${r.type} · ${r.status}`}>
        <div className="rp-cover">
          <img src={coverUrl(r.cover, compact)} alt="" loading="lazy" width={480} height={270} />
          <span className="rp-type"><Icon name={r.type === 'Apresentação' ? 'play' : r.type === 'Relatório paginado' ? 'report' : 'grid'} size={12} />{r.type}</span>
        </div>
        <div className="rp-body">
          <span className="rp-cat">{r.category}</span>
          <h3 className="rp-title">{r.name}</h3>
          {!compact && <p className="rp-desc">{r.description}</p>}
          <div className="rp-meta">
            <Avatar name={r.owner} size={20} /><span className="rp-owner">{r.owner}</span><span className="rp-dot">·</span><span>{r.updated}</span>
          </div>
          {!compact && <StatusBadges r={r} />}
        </div>
      </Link>
      <FavButton id={r.id} name={r.name} />
    </article>
  );
}
