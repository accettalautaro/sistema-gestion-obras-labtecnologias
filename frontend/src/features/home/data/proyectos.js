import casa1 from '../../../assets/imagenCasaProyecto1.jpeg'
import casa2 from '../../../assets/imagenCasaProyecto2.jpeg'
import casa3 from '../../../assets/imagenCasaProyecto3.jpeg'
import casa4 from '../../../assets/imagenCasaProyecto4.jpeg'

const proyectosHome = [
	{
		id: 1,
		titulo: 'Vivienda Moderna',
		imagen: casa1,
		tipo: 'Residencial',
		superficie: '180 m²',
		ubicacion: 'San Luis',
		anio: '2026',
		descripcion: 'Proyecto residencial de estilo moderno, diseñado para aprovechar al máximo los espacios y la iluminación natural.',
		concepto: 'La propuesta organiza los ambientes con una mirada clara y contemporánea, priorizando la relación entre los espacios interiores y la entrada de luz natural. La materialidad y las proporciones acompañan una arquitectura sobria, funcional y pensada para la vida cotidiana.',
		galeria: [casa1],
	},
	{
		id: 2,
		titulo: 'Casa Familiar',
		imagen: casa2,
		tipo: 'Residencial',
		superficie: '220 m²',
		ubicacion: 'San Luis',
		anio: '2025',
		descripcion: 'Vivienda diseñada para una familia, priorizando espacios amplios, funcionales y cómodos.',
		concepto: 'El proyecto parte de la necesidad de reunir a la familia en espacios generosos y flexibles. La distribución busca equilibrar los momentos compartidos con áreas de mayor intimidad, construyendo una vivienda cómoda, luminosa y adaptable.',
		galeria: [casa2],
	},
	{
		id: 3,
		titulo: 'Vivienda Unifamiliar',
		imagen: casa3,
		tipo: 'Residencial',
		superficie: '160 m²',
		ubicacion: 'San Luis',
		anio: '2025',
		descripcion: 'Proyecto de vivienda unifamiliar pensado para combinar funcionalidad, confort y diseño.',
		concepto: 'La arquitectura se resuelve a partir de una organización eficiente y de ambientes que acompañan distintos usos. El diseño combina confort y funcionalidad mediante una propuesta simple, equilibrada y vinculada con las necesidades de sus habitantes.',
		galeria: [casa3],
	},
	{
		id: 4,
		titulo: 'Casa Contemporánea',
		imagen: casa4,
		tipo: 'Residencial',
		superficie: '200 m²',
		ubicacion: 'San Luis',
		anio: '2024',
		descripcion: 'Proyecto residencial de arquitectura contemporánea con espacios abiertos y una estética minimalista.',
		concepto: 'La propuesta contemporánea se apoya en la continuidad visual y en la apertura de los ambientes. La reducción de elementos formales permite que la luz, las proporciones y la conexión entre espacios definan una experiencia doméstica serena y minimalista.',
		galeria: [casa4],
	},
]

export default proyectosHome