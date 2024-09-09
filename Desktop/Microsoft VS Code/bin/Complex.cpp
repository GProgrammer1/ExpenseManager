class Complex {
public:
    
    Complex(double real = 0.0, double imag = 0.0) : real(real), imag(imag) {}

    
    Complex operator+(const Complex& other) const {
        return Complex(real + other.real, imag + other.imag);
    }

    Complex operator-(const Complex& other) const {
        return Complex(real - other.real, imag - other.imag);
    }

    Complex operator*(const Complex& other) const {
        return Complex(real * other.real - imag * other.imag, real * other.imag + imag * other.real);
    }

    Complex operator/(const Complex& other) const {
        double denominator = other.real * other.real + other.imag * other.imag;
        if (denominator == 0) {
            std::cerr << "Division by zero!" << std::endl;
            return Complex(0, 0); 
        }
        return Complex((real * other.real + imag * other.imag) / denominator,
                       (imag * other.real - real * other.imag) / denominator);
    }

    
    double magnitude() const {
        return sqrt(real * real + imag * imag);
    }

    double phase() const {
        return atan2(imag, real);
    }

    
    friend std::ostream& operator<<(std::ostream& out, const Complex& c) {
        out << c.real << (c.imag >= 0 ? "+" : "") << c.imag << "i";
        return out;
    }

private:
    double real, imag;
};