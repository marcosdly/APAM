import './_aboutUs.scss';
import Button from '@/components/Button/Button.tsx';
import IconInsta from '../../../public/images/bi_instagram.svg';
import IconEmail from '../../../public/images/uil_copy.svg';

const AboutUs: React.FC = () => (
  <section className="about-us">
    <div className="about-us__container">
      <div className="about-us__container__imgs">
        <div className="about-us__container__imgs-container">
          <img src="/images/dog1.png" alt="Cachorro com lingua pra fora" />
          <img src="/images/cat1.png" alt="Gato dourado deitado" />
        </div>
      </div>
      <div className="about-us__container__body">
        <div className="about-us__container__body__left">
          <h2>Quem somos</h2>
          <p>
            Somos a{' '}
            <span>Associação Protetora dos Animais de Mato Grosso (APAM)</span>,
            uma organização dedicada ao resgate, cuidado e adoção de animais em
            situações vulneráveis. Nossa missão é proporcionar um lar seguro e
            amoroso para cada ser que cruzar nosso caminho.
          </p>
          <div className="about-us__container__body__button">
            <Button className="about-us__container__body__button__about">
              <a
                href="https://www.instagram.com/apammt?igsh=a2lyNjRwdXNkOHg3"
                target="_blank"
                rel="noreferrer"
              >
                <img src={IconInsta} alt="Ícone instagram" />
                Conheça nosso instagram
              </a>
            </Button>
            <Button className="about-us__container__body__button__contact">
              <a
                href="mailto:apammt@gmail.com"
                target="_blank"
                rel="noreferrer"
              >
                <img src={IconEmail} alt="Ícone Email" />
                Contate-nos no email
              </a>
            </Button>
          </div>
        </div>
        <div className="about-us__container__body__right">
          <h2>Nossa missão</h2>
          <p>Além do resgate e do incentivo a adoção, nós também:</p>
          <div className="about-us__container__body__button">
            <Button className="about-us__container__body__button-card">
              <img src="/images/Pata.svg" alt="Ícone de patinha" />
              Defendemos os animais.
            </Button>
            <Button className="about-us__container__body__button-card">
              <img src="/images/Pata.svg" alt="Ícone de patinha" />
              Lutamos por políticas públicas em prol dos animais.
            </Button>
            <Button className="about-us__container__body__button-card">
              <img src="/images/Pata.svg" alt="Ícone de patinha" />
              Zelamos pelo meio-ambiente.
            </Button>
            <Button className="about-us__container__body__button-card">
              <img src="/images/Pata.svg" alt="Ícone de patinha" />
              Incentivamos a sociedade na proteção à flora e a fauna.
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutUs;
