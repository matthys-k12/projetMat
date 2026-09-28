/**
 * Graphiques du dashboard admin (Recharts) : courbe « Demandes sur 14 jours »
 * et barres « Top 5 matériels demandés ».
 *
 * Tier : présentation. Une seule série par graphique, couleur primary (pas de légende :
 * le titre nomme la série). Grille discrète, textes en couleurs de texte (jamais
 * la couleur de la série), infobulle au survol, et un tableau masqué pour les
 * lecteurs d'écran (la donnée n'est jamais portée par le graphique seul).
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';

const PRIMAIRE = 'hsl(221.2 83.2% 53.3%)';
const GRILLE = 'hsl(214.3 31.8% 91.4%)';
const TEXTE_SECONDAIRE = 'hsl(215.4 16.3% 46.9%)';
const AXE = { fontSize: 12, fill: TEXTE_SECONDAIRE };

/**
 * Infobulle sobre (carte blanche, bordure) commune aux deux graphiques.
 * @param {{ active?: boolean, payload?: any[], label?: string, unite: string }} props
 */
function Infobulle({ active, payload, label, unite }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-small shadow-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="chiffres font-semibold">
        {payload[0].value} {unite}
      </div>
    </div>
  );
}

/**
 * Tableau équivalent, lu par les lecteurs d'écran.
 * @param {{ legende: string, lignes: [string, number][] }} props
 */
function TableauAccessible({ legende, lignes }) {
  return (
    <table className="sr-only">
      <caption>{legende}</caption>
      <tbody>
        {lignes.map(([cle, valeur]) => (
          <tr key={cle}>
            <th scope="row">{cle}</th>
            <td>{valeur}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * @param {{ jours: { date: string, nombre: number }[] }} props
 */
export function CourbeQuatorzeJours({ jours }) {
  const donnees = jours.map((j) => ({ jour: format(new Date(j.date), 'dd/MM'), nombre: j.nombre }));
  return (
    <>
      <div className="h-[240px]" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={donnees} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={GRILLE} vertical={false} />
            <XAxis
              dataKey="jour"
              tick={AXE}
              tickLine={false}
              axisLine={{ stroke: GRILLE }}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} tick={AXE} tickLine={false} axisLine={false} />
            <Tooltip content={<Infobulle unite="demandes" />} cursor={{ stroke: GRILLE }} />
            <Line
              type="monotone"
              dataKey="nombre"
              stroke={PRIMAIRE}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, stroke: 'white', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <TableauAccessible
        legende="Demandes par jour"
        lignes={donnees.map((d) => [d.jour, d.nombre])}
      />
    </>
  );
}

/**
 * @param {{ materiels: { id: string, nom: string, totalDemande: number }[] }} props
 */
export function BarresTopMateriels({ materiels }) {
  return (
    <>
      <div className="h-[240px]" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={materiels}
            layout="vertical"
            margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
            barCategoryGap={10}
          >
            <CartesianGrid stroke={GRILLE} horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={AXE}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="nom"
              width={140}
              tick={AXE}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<Infobulle unite="unités demandées" />}
              cursor={{ fill: 'hsl(210 40% 96.1%)' }}
            />
            <Bar
              dataKey="totalDemande"
              fill={PRIMAIRE}
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableauAccessible
        legende="Unités demandées par matériel"
        lignes={materiels.map((m) => [m.nom, m.totalDemande])}
      />
    </>
  );
}
